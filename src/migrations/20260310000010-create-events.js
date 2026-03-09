'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── ENUMs ──────────────────────────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_events_type" AS ENUM (
          'open_house', 'team_meeting', 'training', 'networking',
          'client_viewing', 'company_event', 'deadline', 'other'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_events_status" AS ENUM (
          'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_event_attendees_rsvpStatus" AS ENUM (
          'pending', 'accepted', 'declined', 'tentative'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // ── events table ──────────────────────────────────────────────────────────
    await queryInterface.createTable('events', {
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
      type: {
        type: Sequelize.ENUM(
          'open_house', 'team_meeting', 'training', 'networking',
          'client_viewing', 'company_event', 'deadline', 'other'
        ),
        allowNull: false,
        defaultValue: 'other',
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      isAllDay: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      onlineLink: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      organizerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      maxAttendees: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
        ),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      isRecurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      recurrencePattern: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: '[]',
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

    // ── event_attendees table ─────────────────────────────────────────────────
    await queryInterface.createTable('event_attendees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rsvpStatus: {
        type: Sequelize.ENUM('pending', 'accepted', 'declined', 'tentative'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rsvpDate: {
        type: Sequelize.DATEONLY,
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

    // ── Indexes ───────────────────────────────────────────────────────────────
    await queryInterface.addIndex('events', ['startDate']);
    await queryInterface.addIndex('events', ['endDate']);
    await queryInterface.addIndex('events', ['type']);
    await queryInterface.addIndex('events', ['status']);
    await queryInterface.addIndex('events', ['organizerId']);
    await queryInterface.addIndex('events', ['branchId']);
    await queryInterface.addIndex('events', ['propertyId']);

    await queryInterface.addIndex('event_attendees', ['eventId']);
    await queryInterface.addIndex('event_attendees', ['userId']);
    await queryInterface.addIndex('event_attendees', ['rsvpStatus']);
    await queryInterface.addIndex('event_attendees', ['eventId', 'userId'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('event_attendees');
    await queryInterface.dropTable('events');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_events_type" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_events_status" CASCADE');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_event_attendees_rsvpStatus" CASCADE');
  },
};
