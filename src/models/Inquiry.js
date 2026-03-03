'use strict';

module.exports = (sequelize, DataTypes) => {
  const Inquiry = sequelize.define(
    'Inquiry',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('property', 'work_with_us', 'affiliate', 'general', 'viewing', 'valuation'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'new',
          'open',
          'assigned',
          'in_progress',
          'viewing_scheduled',
          'resolved',
          'closed',
          'spam'
        ),
        defaultValue: 'new',
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        allowNull: false,
      },
      source: {
        type: DataTypes.ENUM(
          'website',
          'phone',
          'email',
          'whatsapp',
          'walk_in',
          'referral',
          'social_media',
          'other'
        ),
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
      },
      assignedToId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      assignmentDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      closedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      questionnaire: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'inquiries',
    }
  );

  Inquiry.associate = (models) => {
    Inquiry.belongsTo(models.Property, { foreignKey: 'propertyId' });
    Inquiry.belongsTo(models.User, { foreignKey: 'assignedToId', as: 'assignedTo' });
    Inquiry.hasMany(models.InquiryAssignment, { foreignKey: 'inquiryId' });
  };

  return Inquiry;
};
