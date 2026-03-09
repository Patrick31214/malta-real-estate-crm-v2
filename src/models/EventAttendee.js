'use strict';

module.exports = (sequelize, DataTypes) => {
  const EventAttendee = sequelize.define(
    'EventAttendee',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rsvpStatus: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'tentative'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rsvpDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'event_attendees',
    }
  );

  EventAttendee.associate = (models) => {
    EventAttendee.belongsTo(models.Event, { as: 'event', foreignKey: 'eventId' });
    EventAttendee.belongsTo(models.User,  { as: 'user',  foreignKey: 'userId' });
  };

  return EventAttendee;
};
