'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUMs for training_courses and training_progress
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_training_courses_category" AS ENUM (
          'onboarding', 'sales', 'legal', 'compliance',
          'product_knowledge', 'soft_skills', 'technology', 'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_training_courses_difficulty" AS ENUM (
          'beginner', 'intermediate', 'advanced'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_training_courses_contentType" AS ENUM (
          'video', 'document', 'quiz', 'interactive', 'external_link'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_training_progress_status" AS ENUM (
          'not_started', 'in_progress', 'completed'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryInterface.createTable('training_courses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'other',
      },
      difficulty: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'beginner',
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      contentType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'document',
      },
      contentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      thumbnailUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      instructor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isRequired: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('training_courses', ['category']);
    await queryInterface.addIndex('training_courses', ['difficulty']);
    await queryInterface.addIndex('training_courses', ['isPublished']);
    await queryInterface.addIndex('training_courses', ['isRequired']);
    await queryInterface.addIndex('training_courses', ['createdBy']);
    await queryInterface.addIndex('training_courses', ['order']);

    await queryInterface.createTable('training_progress', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      courseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'training_courses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'not_started',
      },
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('training_progress', ['userId']);
    await queryInterface.addIndex('training_progress', ['courseId']);
    await queryInterface.addIndex('training_progress', ['status']);
    await queryInterface.addIndex('training_progress', ['userId', 'courseId'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('training_progress');
    await queryInterface.dropTable('training_courses');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_training_progress_status" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_training_courses_contentType" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_training_courses_difficulty" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_training_courses_category" CASCADE');
  },
};
