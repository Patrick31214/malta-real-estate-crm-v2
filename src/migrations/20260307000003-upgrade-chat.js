'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── chat_channels ──────────────────────────────────────────────────────────
    // Drop old type enum column and recreate with new values
    await queryInterface.removeColumn('chat_channels', 'type');
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS \"enum_chat_channels_type\";"
    );
    await queryInterface.addColumn('chat_channels', 'type', {
      type: Sequelize.ENUM('direct', 'role_group', 'branch', 'property_updates', 'general'),
      allowNull: false,
      defaultValue: 'general',
    });

    // Add new columns to chat_channels
    await queryInterface.addColumn('chat_channels', 'participantIds', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('chat_channels', 'allowedRoles', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('chat_channels', 'branchId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'branches', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('chat_channels', 'createdById', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('chat_channels', 'lastMessageAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // ── chat_messages ──────────────────────────────────────────────────────────
    // Rename userId → senderId
    try {
      await queryInterface.renameColumn('chat_messages', 'userId', 'senderId');
    } catch {
      // Column may already be named senderId if migration ran partially
    }

    // Remove old columns that are no longer needed
    try {
      await queryInterface.removeColumn('chat_messages', 'isEdited');
    } catch { /* ignore */ }
    try {
      await queryInterface.removeColumn('chat_messages', 'isPinned');
    } catch { /* ignore */ }

    // Add new columns to chat_messages
    await queryInterface.addColumn('chat_messages', 'type', {
      type: Sequelize.ENUM('text', 'system', 'property_update'),
      allowNull: false,
      defaultValue: 'text',
    });
    await queryInterface.addColumn('chat_messages', 'propertyId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'properties', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('chat_messages', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('chat_messages', 'isRead', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    });

    // Indexes
    await queryInterface.addIndex('chat_channels', ['type']);
    await queryInterface.addIndex('chat_channels', ['lastMessageAt']);
    await queryInterface.addIndex('chat_messages', ['channelId', 'createdAt']);
    await queryInterface.addIndex('chat_messages', ['senderId']);
  },

  async down(queryInterface, Sequelize) {
    // Revert chat_messages
    try { await queryInterface.removeColumn('chat_messages', 'isRead'); } catch { /* ignore */ }
    try { await queryInterface.removeColumn('chat_messages', 'metadata'); } catch { /* ignore */ }
    try { await queryInterface.removeColumn('chat_messages', 'propertyId'); } catch { /* ignore */ }
    try { await queryInterface.removeColumn('chat_messages', 'type'); } catch { /* ignore */ }
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_chat_messages_type\";");

    try { await queryInterface.renameColumn('chat_messages', 'senderId', 'userId'); } catch { /* ignore */ }
    await queryInterface.addColumn('chat_messages', 'isEdited', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('chat_messages', 'isPinned', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Revert chat_channels new columns
    try { await queryInterface.removeColumn('chat_channels', 'lastMessageAt'); } catch { /* ignore */ }
    try { await queryInterface.removeColumn('chat_channels', 'createdById'); } catch { /* ignore */ }
    try { await queryInterface.removeColumn('chat_channels', 'branchId'); } catch { /* ignore */ }
    try { await queryInterface.removeColumn('chat_channels', 'allowedRoles'); } catch { /* ignore */ }
    try { await queryInterface.removeColumn('chat_channels', 'participantIds'); } catch { /* ignore */ }

    // Restore old type enum
    await queryInterface.removeColumn('chat_channels', 'type');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_chat_channels_type\";");
    await queryInterface.addColumn('chat_channels', 'type', {
      type: Sequelize.ENUM('rentals', 'sales', 'managers', 'staff', 'general', 'custom'),
      allowNull: false,
      defaultValue: 'general',
    });
  },
};
