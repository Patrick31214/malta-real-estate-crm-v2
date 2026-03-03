'use strict';

module.exports = (sequelize, DataTypes) => {
  const InquiryAssignment = sequelize.define(
    'InquiryAssignment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      inquiryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'inquiries', key: 'id' },
      },
      assignedToId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      assignedById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'reassigned', 'expired'),
        defaultValue: 'pending',
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'inquiry_assignments',
    }
  );

  InquiryAssignment.associate = (models) => {
    InquiryAssignment.belongsTo(models.Inquiry, { foreignKey: 'inquiryId' });
    InquiryAssignment.belongsTo(models.User, { foreignKey: 'assignedToId', as: 'assignedTo' });
    InquiryAssignment.belongsTo(models.User, { foreignKey: 'assignedById', as: 'assignedBy' });
  };

  return InquiryAssignment;
};
