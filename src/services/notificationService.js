'use strict';

/**
 * Notification Service
 * Creates notifications for significant CRM events.
 * Called from route handlers throughout the app.
 * All public functions are fire-and-forget safe — callers wrap in try/catch.
 */

const { Notification, User, UserPermission } = require('../models');
const { Op } = require('sequelize');

// ── Permission-aware delivery ─────────────────────────────────────────────────

/**
 * Returns true if a user (given their role and permissions) should receive
 * a notification of the given permission key.
 * Admins always receive all notifications.
 */
async function userHasNotificationPermission(userId, role, permissionKey) {
  if (role === 'admin') return true;
  try {
    const perm = await UserPermission.findOne({
      where: { userId, feature: permissionKey, isEnabled: true },
    });
    return perm !== null;
  } catch {
    return false;
  }
}

// ── Core send helpers ─────────────────────────────────────────────────────────

/**
 * Send a notification to a single user.
 * Checks notification_view + the event-specific permission before creating.
 */
async function notifyUser(recipientId, {
  type, title, message,
  entityType, entityId, actionUrl,
  priority = 'normal', senderId, metadata,
  permissionKey,
}) {
  try {
    const user = await User.findByPk(recipientId, { attributes: ['id', 'role', 'isActive'] });
    if (!user || !user.isActive) return;

    // Skip permission check for admins; for others, check view + event permission
    if (user.role !== 'admin' && permissionKey) {
      const canView  = await userHasNotificationPermission(recipientId, user.role, 'notifications_view');
      const canEvent = await userHasNotificationPermission(recipientId, user.role, permissionKey);
      if (!canView || !canEvent) return;
    }

    await Notification.create({
      recipientId,
      senderId: senderId || null,
      type,
      title,
      message,
      entityType: entityType || null,
      entityId:   entityId   || null,
      actionUrl:  actionUrl  || null,
      priority,
      isRead: false,
      metadata: metadata || null,
    });
  } catch (err) {
    console.error(`[notificationService] notifyUser error for ${recipientId}:`, err.message);
  }
}

/**
 * Send a notification to all users with a specific role.
 */
async function notifyRole(role, payload) {
  try {
    const users = await User.findAll({
      where: { role, isActive: true, isBlocked: false },
      attributes: ['id', 'role'],
    });
    await Promise.all(users.map(u => notifyUser(u.id, payload)));
  } catch (err) {
    console.error('[notificationService] notifyRole error:', err.message);
  }
}

/**
 * Send a notification to all users in a branch.
 */
async function notifyBranch(branchId, payload) {
  if (!branchId) return;
  try {
    const users = await User.findAll({
      where: { branchId, isActive: true, isBlocked: false },
      attributes: ['id', 'role'],
    });
    await Promise.all(users.map(u => notifyUser(u.id, payload)));
  } catch (err) {
    console.error('[notificationService] notifyBranch error:', err.message);
  }
}

/**
 * Send a notification to multiple specific users.
 */
async function notifyUsers(recipientIds, payload) {
  if (!Array.isArray(recipientIds) || !recipientIds.length) return;
  await Promise.all(recipientIds.map(id => notifyUser(id, payload)));
}

// ── Event-specific helpers ────────────────────────────────────────────────────

async function onPropertyCreated(property, createdBy) {
  const payload = {
    type: 'property_created',
    title: 'New Property Listed',
    message: `${createdBy.firstName} ${createdBy.lastName} listed "${property.title}" in ${property.locality}`,
    entityType: 'property',
    entityId: property.id,
    actionUrl: `/crm/properties/${property.id}`,
    senderId: createdBy.id,
    priority: 'normal',
    permissionKey: 'notifications_property_events',
    metadata: { propertyTitle: property.title, locality: property.locality, price: property.price },
  };

  // Notify admins
  await notifyRole('admin', payload);
  // Notify managers
  await notifyRole('manager', payload);
  // Notify agents in the same branch (excluding the creator)
  if (property.branchId) {
    const branchAgents = await User.findAll({
      where: {
        branchId: property.branchId,
        role: 'agent',
        id: { [Op.ne]: createdBy.id },
        isActive: true,
        isBlocked: false,
      },
      attributes: ['id', 'role'],
    });
    await Promise.all(branchAgents.map(u => notifyUser(u.id, payload)));
  }
}

async function onPropertyStatusChanged(property, oldStatus, newStatus, changedBy) {
  const statusLabels = {
    draft: 'Draft', listed: 'Listed', under_offer: 'Under Offer',
    sold: 'Sold', rented: 'Rented', withdrawn: 'Withdrawn',
  };
  const typeMap = {
    sold:   'property_sold',
    rented: 'property_rented',
  };
  const notifType = typeMap[newStatus] || 'property_status_changed';

  const payload = {
    type: notifType,
    title: 'Property Status Changed',
    message: `"${property.title}" status changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}`,
    entityType: 'property',
    entityId: property.id,
    actionUrl: `/crm/properties/${property.id}`,
    senderId: changedBy ? changedBy.id : null,
    priority: newStatus === 'sold' || newStatus === 'rented' ? 'high' : 'normal',
    permissionKey: 'notifications_property_events',
    metadata: { propertyTitle: property.title, oldStatus, newStatus },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
  if (property.agentId && changedBy && property.agentId !== changedBy.id) {
    await notifyUser(property.agentId, payload);
  }
}

async function onPropertyPriceChanged(property, oldPrice, newPrice, changedBy) {
  const payload = {
    type: 'property_price_changed',
    title: 'Property Price Updated',
    message: `"${property.title}" price changed from €${Number(oldPrice).toLocaleString()} to €${Number(newPrice).toLocaleString()}`,
    entityType: 'property',
    entityId: property.id,
    actionUrl: `/crm/properties/${property.id}`,
    senderId: changedBy ? changedBy.id : null,
    priority: 'normal',
    permissionKey: 'notifications_property_events',
    metadata: { propertyTitle: property.title, oldPrice, newPrice },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
}

async function onClientCreated(client, createdBy) {
  const payload = {
    type: 'client_created',
    title: 'New Client Added',
    message: `${createdBy.firstName} ${createdBy.lastName} added client "${client.firstName} ${client.lastName}"`,
    entityType: 'client',
    entityId: client.id,
    actionUrl: '/crm/clients',
    senderId: createdBy.id,
    priority: 'normal',
    permissionKey: 'notifications_client_events',
    metadata: { clientName: `${client.firstName} ${client.lastName}` },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
}

async function onClientAssigned(client, agentId, assignedBy) {
  const payload = {
    type: 'client_assigned',
    title: 'Client Assigned to You',
    message: `${assignedBy.firstName} ${assignedBy.lastName} assigned "${client.firstName} ${client.lastName}" to you`,
    entityType: 'client',
    entityId: client.id,
    actionUrl: '/crm/clients',
    senderId: assignedBy.id,
    priority: 'high',
    permissionKey: 'notifications_client_events',
    metadata: { clientName: `${client.firstName} ${client.lastName}` },
  };

  if (agentId) await notifyUser(agentId, payload);
}

async function onInquiryCreated(inquiry, createdBy) {
  const payload = {
    type: 'inquiry_created',
    title: 'New Inquiry Received',
    message: `New inquiry from ${inquiry.firstName || 'unknown'} ${inquiry.lastName || ''}`.trim(),
    entityType: 'inquiry',
    entityId: inquiry.id,
    actionUrl: '/crm/inquiries',
    senderId: createdBy ? createdBy.id : null,
    priority: 'high',
    permissionKey: 'notifications_inquiry_events',
    metadata: { inquiryId: inquiry.id },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
}

async function onInquiryAssigned(inquiry, agentId, assignedBy) {
  const payload = {
    type: 'inquiry_assigned',
    title: 'Inquiry Assigned to You',
    message: `${assignedBy.firstName} ${assignedBy.lastName} assigned an inquiry to you`,
    entityType: 'inquiry',
    entityId: inquiry.id,
    actionUrl: '/crm/inquiries',
    senderId: assignedBy.id,
    priority: 'high',
    permissionKey: 'notifications_inquiry_events',
    metadata: { inquiryId: inquiry.id },
  };

  if (agentId) await notifyUser(agentId, payload);
}

async function onAgentCreated(agent) {
  const payload = {
    type: 'agent_created',
    title: 'New Agent Added',
    message: `${agent.firstName} ${agent.lastName} has been added as a new ${agent.role}`,
    entityType: 'agent',
    entityId: agent.id,
    actionUrl: '/crm/agents',
    priority: 'normal',
    permissionKey: 'notifications_agent_events',
    metadata: { agentName: `${agent.firstName} ${agent.lastName}`, role: agent.role },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
}

async function onAgentApproved(agent, approvedBy) {
  const adminManagerPayload = {
    type: 'agent_approved',
    title: 'Agent Approved',
    message: `${agent.firstName} ${agent.lastName} has been approved by ${approvedBy.firstName} ${approvedBy.lastName}`,
    entityType: 'agent',
    entityId: agent.id,
    actionUrl: '/crm/agents',
    senderId: approvedBy.id,
    priority: 'normal',
    permissionKey: 'notifications_agent_events',
    metadata: { agentName: `${agent.firstName} ${agent.lastName}` },
  };

  await notifyRole('admin', adminManagerPayload);
  await notifyRole('manager', adminManagerPayload);

  // Also notify the agent themselves
  await notifyUser(agent.id, {
    type: 'agent_approved',
    title: 'Your Account Has Been Approved',
    message: `Your account has been approved by ${approvedBy.firstName} ${approvedBy.lastName}. Welcome to the team!`,
    entityType: 'agent',
    entityId: agent.id,
    actionUrl: '/crm/dashboard',
    senderId: approvedBy.id,
    priority: 'high',
    permissionKey: 'notifications_agent_events',
  });
}

async function onAgentBlocked(agent, blockedBy) {
  const payload = {
    type: 'agent_blocked',
    title: 'Agent Blocked',
    message: `${agent.firstName} ${agent.lastName} has been blocked by ${blockedBy.firstName} ${blockedBy.lastName}`,
    entityType: 'agent',
    entityId: agent.id,
    actionUrl: '/crm/agents',
    senderId: blockedBy.id,
    priority: 'high',
    permissionKey: 'notifications_agent_events',
    metadata: { agentName: `${agent.firstName} ${agent.lastName}` },
  };

  await notifyRole('admin', payload);
}

async function onAnnouncementCreated(announcement, createdBy) {
  const payload = {
    type: 'announcement_created',
    title: 'New Announcement',
    message: `${createdBy.firstName} ${createdBy.lastName} posted: "${announcement.title}"`,
    entityType: 'announcement',
    entityId: announcement.id,
    actionUrl: '/crm/announcements',
    senderId: createdBy.id,
    priority: announcement.priority === 'urgent' ? 'urgent' : 'normal',
    permissionKey: 'notifications_announcement_events',
    metadata: { announcementTitle: announcement.title },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
  await notifyRole('agent', payload);
}

async function onOwnerCreated(owner, createdBy) {
  const ownerName = `${owner.firstName} ${owner.lastName}`;
  const payload = {
    type: 'owner_created',
    title: 'New Owner Added',
    message: `${createdBy.firstName} ${createdBy.lastName} added owner "${ownerName}"`,
    entityType: 'owner',
    entityId: owner.id,
    actionUrl: `/crm/owners/${owner.id}`,
    senderId: createdBy.id,
    priority: 'normal',
    permissionKey: 'notifications_client_events',
    metadata: { ownerName },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
}

async function onOwnerUpdated(owner, changedFields, updatedBy) {
  const ownerName = `${owner.firstName} ${owner.lastName}`;
  const payload = {
    type: 'owner_updated',
    title: 'Owner Updated',
    message: `${updatedBy.firstName} ${updatedBy.lastName} updated owner "${ownerName}"`,
    entityType: 'owner',
    entityId: owner.id,
    actionUrl: `/crm/owners/${owner.id}`,
    senderId: updatedBy.id,
    priority: 'normal',
    permissionKey: 'notifications_client_events',
    metadata: { ownerName, changedFields },
  };

  await notifyRole('admin', payload);
  await notifyRole('manager', payload);
}

async function onBranchCreated(branch, createdBy) {
  const payload = {
    type: 'branch_created',
    title: 'New Branch Created',
    message: `${createdBy.firstName} ${createdBy.lastName} created branch "${branch.name}"`,
    entityType: 'branch',
    entityId: branch.id,
    actionUrl: '/crm/branches',
    senderId: createdBy.id,
    priority: 'normal',
    permissionKey: 'notifications_branch_events',
    metadata: { branchName: branch.name },
  };

  await notifyRole('admin', payload);
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

/**
 * Delete notifications older than 30 days.
 * Safe to call periodically (e.g., on server start).
 */
async function cleanupOldNotifications() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const deleted = await Notification.destroy({
      where: { createdAt: { [Op.lt]: cutoff } },
    });
    if (deleted > 0) {
      console.log(`[notificationService] Cleaned up ${deleted} notifications older than 30 days`);
    }
  } catch (err) {
    console.error('[notificationService] cleanupOldNotifications error:', err.message);
  }
}

module.exports = {
  notifyUser,
  notifyRole,
  notifyBranch,
  notifyUsers,
  onPropertyCreated,
  onPropertyStatusChanged,
  onPropertyPriceChanged,
  onClientCreated,
  onClientAssigned,
  onInquiryCreated,
  onInquiryAssigned,
  onAgentCreated,
  onAgentApproved,
  onAgentBlocked,
  onAnnouncementCreated,
  onBranchCreated,
  onOwnerCreated,
  onOwnerUpdated,
  cleanupOldNotifications,
};
