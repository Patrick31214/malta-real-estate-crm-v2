'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agent_metrics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'userId',
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      metricType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'metricType',
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'entityType',
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'entityId',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('agent_metrics', ['userId']);
    await queryInterface.addIndex('agent_metrics', ['metricType']);
    await queryInterface.addIndex('agent_metrics', ['createdAt']);
    await queryInterface.addIndex('agent_metrics', ['userId', 'metricType']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agent_metrics');
  },
};
