'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add owner_update to the chat_messages type ENUM
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_chat_messages_type\" ADD VALUE IF NOT EXISTS 'owner_update';"
    );

    // Add ownerId column to chat_messages
    await queryInterface.addColumn('chat_messages', 'ownerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'owners', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('chat_messages', 'ownerId');
    // Note: PostgreSQL does not support removing values from an ENUM type directly.
    // The owner_update value will remain but will be unused after rollback.
  },
};
