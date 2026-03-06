'use strict';

/**
 * Agent permission feature keys.
 * Each entry defines the key stored in user_permissions.feature,
 * a human-readable label, and the category grouping.
 */
const AGENT_PERMISSION_CATEGORIES = [
  {
    id: 'dashboard',
    label: 'Dashboard & Analytics',
    icon: '📊',
    permissions: [
      { key: 'dashboard_view',           label: 'View Dashboard' },
      { key: 'dashboard_analytics',      label: 'View Analytics Charts' },
      { key: 'dashboard_revenue',        label: 'View Revenue Metrics' },
      { key: 'dashboard_agent_perf',     label: 'View Agent Performance' },
      { key: 'dashboard_market',         label: 'View Market Insights' },
      { key: 'dashboard_export',         label: 'Export Reports' },
    ],
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: '🏠',
    permissions: [
      { key: 'properties_view',          label: 'View Properties' },
      { key: 'properties_create',        label: 'Create Properties' },
      { key: 'properties_edit',          label: 'Edit Properties' },
      { key: 'properties_delete',        label: 'Delete Properties' },
      { key: 'properties_approve',       label: 'Approve/Reject Properties' },
      { key: 'properties_feature',       label: 'Feature/Unfeature Properties' },
      { key: 'properties_owner_details', label: 'View Owner Details on Properties' },
      { key: 'properties_export',        label: 'Export Properties' },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: '👥',
    permissions: [
      { key: 'clients_view',             label: 'View Clients' },
      { key: 'clients_create',           label: 'Create Clients' },
      { key: 'clients_edit',             label: 'Edit Clients' },
      { key: 'clients_delete',           label: 'Delete Clients' },
      { key: 'clients_matches',          label: 'View Client Matches' },
      { key: 'clients_recalc',           label: 'Recalculate Matches' },
    ],
  },
  {
    id: 'owners',
    label: 'Owners',
    icon: '🏢',
    permissions: [
      { key: 'owners_view',              label: 'View Owners' },
      { key: 'owners_create',            label: 'Create Owners' },
      { key: 'owners_edit',              label: 'Edit Owners' },
      { key: 'owners_delete',            label: 'Delete Owners' },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: '📇',
    permissions: [
      { key: 'contacts_view',            label: 'View Contacts' },
      { key: 'contacts_create',          label: 'Create Contacts' },
      { key: 'contacts_edit',            label: 'Edit Contacts' },
      { key: 'contacts_delete',          label: 'Delete Contacts' },
    ],
  },
  {
    id: 'inquiries',
    label: 'Inquiries',
    icon: '📋',
    permissions: [
      { key: 'inquiries_view_all',       label: 'View All Inquiries' },
      { key: 'inquiries_view_own',       label: 'View Own Inquiries Only' },
      { key: 'inquiries_create',         label: 'Create Inquiries' },
      { key: 'inquiries_assign',         label: 'Assign Inquiries' },
      { key: 'inquiries_close',          label: 'Close Inquiries' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: '💬',
    permissions: [
      { key: 'chat_internal',            label: 'Internal Chat' },
      { key: 'announcements_send',       label: 'Send Announcements' },
      { key: 'announcements_view',       label: 'View Announcements' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: '📄',
    permissions: [
      { key: 'documents_view',           label: 'View Documents' },
      { key: 'documents_upload',         label: 'Upload Documents' },
      { key: 'documents_delete',         label: 'Delete Documents' },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: '📅',
    permissions: [
      { key: 'calendar_view',            label: 'View Calendar' },
      { key: 'calendar_schedule',        label: 'Schedule Viewings' },
      { key: 'calendar_edit',            label: 'Edit Viewings' },
    ],
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: '💰',
    permissions: [
      { key: 'financial_own_commission', label: 'View Own Commission' },
      { key: 'financial_all_commission', label: 'View All Commissions' },
      { key: 'financial_revenue',        label: 'View Revenue Dashboard' },
      { key: 'financial_mortgage_calc',  label: 'Mortgage Calculator' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: '🏢',
    permissions: [
      { key: 'admin_agents',             label: 'Manage Agents' },
      { key: 'admin_branches',           label: 'Manage Branches' },
      { key: 'admin_activity_logs',      label: 'View Activity Logs' },
      { key: 'admin_compliance',         label: 'View Compliance' },
      { key: 'admin_settings',           label: 'System Settings' },
    ],
  },
];

/** Flat array of all permission keys */
const ALL_PERMISSION_KEYS = AGENT_PERMISSION_CATEGORIES.flatMap(cat =>
  cat.permissions.map(p => p.key)
);

module.exports = { AGENT_PERMISSION_CATEGORIES, ALL_PERMISSION_KEYS };
