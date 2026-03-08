'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('agent_metrics', 'ipAddress', {
      type: Sequelize.STRING(45),
      allowNull: true,
    });
    await queryInterface.addColumn('agent_metrics', 'userAgent', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('agent_metrics', 'sessionId', {
      type: Sequelize.STRING(128),
      allowNull: true,
    });
    await queryInterface.addColumn('agent_metrics', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('agent_metrics', 'pageUrl', {
      type: Sequelize.STRING(2048),
      allowNull: true,
    });

    await queryInterface.addIndex('agent_metrics', ['sessionId'], {
      name: 'agent_metrics_session_id_idx',
    });
    await queryInterface.addIndex('agent_metrics', ['pageUrl'], {
      name: 'agent_metrics_page_url_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('agent_metrics', 'agent_metrics_page_url_idx');
    await queryInterface.removeIndex('agent_metrics', 'agent_metrics_session_id_idx');
    await queryInterface.removeColumn('agent_metrics', 'pageUrl');
    await queryInterface.removeColumn('agent_metrics', 'duration');
    await queryInterface.removeColumn('agent_metrics', 'sessionId');
    await queryInterface.removeColumn('agent_metrics', 'userAgent');
    await queryInterface.removeColumn('agent_metrics', 'ipAddress');
  },
};
