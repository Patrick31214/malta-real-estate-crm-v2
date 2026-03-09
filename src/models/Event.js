'use strict';

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'Event',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          'open_house',
          'team_meeting',
          'training',
          'networking',
          'client_viewing',
          'company_event',
          'deadline',
          'other'
        ),
        allowNull: false,
        defaultValue: 'other',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      isAllDay: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      onlineLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      branchId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      organizerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      maxAttendees: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'scheduled',
          'in_progress',
          'completed',
          'cancelled',
          'postponed'
        ),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      recurrencePattern: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: 'events',
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.User,     { as: 'organizer', foreignKey: 'organizerId' });
    Event.belongsTo(models.Property, { as: 'property',  foreignKey: 'propertyId' });
    Event.belongsTo(models.Branch,   { as: 'branch',    foreignKey: 'branchId' });
    Event.hasMany(models.EventAttendee, { as: 'attendees', foreignKey: 'eventId', onDelete: 'CASCADE' });
  };

  return Event;
};
