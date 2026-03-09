'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('documents');

    // Add new ENUM values to existing category type
    const newCategoryValues = ['agreement', 'permit', 'certificate', 'report', 'financial', 'template', 'correspondence'];
    for (const val of newCategoryValues) {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '${val}' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_documents_category')) THEN ALTER TYPE "enum_documents_category" ADD VALUE '${val}'; END IF; END $$;`
      );
    }

    // Add status enum type and column
    if (!table['status']) {
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_documents_status" AS ENUM ('draft', 'pending_review', 'approved', 'signed', 'archived', 'expired');`
      );
      await queryInterface.addColumn('documents', 'status', {
        type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'signed', 'archived', 'expired'),
        allowNull: true,
        defaultValue: 'draft',
      });
    }

    // Add description
    if (!table['description']) {
      await queryInterface.addColumn('documents', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Add isConfidential
    if (!table['isConfidential']) {
      await queryInterface.addColumn('documents', 'isConfidential', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // Add tags
    if (!table['tags']) {
      await queryInterface.addColumn('documents', 'tags', {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      });
    }

    // Add expiryDate
    if (!table['expiryDate']) {
      await queryInterface.addColumn('documents', 'expiryDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    // Add clientId
    if (!table['clientId']) {
      await queryInterface.addColumn('documents', 'clientId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('documents');

    if (table['clientId'])      await queryInterface.removeColumn('documents', 'clientId');
    if (table['expiryDate'])    await queryInterface.removeColumn('documents', 'expiryDate');
    if (table['tags'])          await queryInterface.removeColumn('documents', 'tags');
    if (table['isConfidential']) await queryInterface.removeColumn('documents', 'isConfidential');
    if (table['description'])   await queryInterface.removeColumn('documents', 'description');
    if (table['status'])        await queryInterface.removeColumn('documents', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_status";');
  },
};
