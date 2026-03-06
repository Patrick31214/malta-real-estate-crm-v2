'use strict';

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { len: [8, 255] },
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'manager', 'agent', 'client'),
        allowNull: false,
        defaultValue: 'client',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      branchId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      specializations: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      languages: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      licenseNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      commissionRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      blockedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      blockedReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passportImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      idCardImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contractFile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otherDocuments: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      emergencyContact: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emergencyPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nationality: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eireLicenseExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      jobTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      approvalStatus: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'approved',
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
    }
  );

  User.prototype.validatePassword = function (plaintext) {
    return bcrypt.compare(plaintext, this.password);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  User.associate = (models) => {
    User.belongsTo(models.Branch, { foreignKey: 'branchId' });
    User.hasMany(models.Property, { foreignKey: 'agentId' });
    User.hasMany(models.Inquiry, { foreignKey: 'assignedToId' });
    User.hasMany(models.Document, { foreignKey: 'uploadedById', as: 'uploadedDocuments' });
    User.hasMany(models.Document, { foreignKey: 'userId', as: 'ownedDocuments' });
    User.hasMany(models.ChatMessage, { foreignKey: 'userId' });
    User.hasMany(models.UserPermission, { foreignKey: 'userId' });
    User.hasMany(models.InquiryAssignment, { foreignKey: 'assignedToId', as: 'assignedInquiries' });
    User.hasMany(models.Announcement, { foreignKey: 'createdById' });
    User.hasMany(models.ActivityLog, { foreignKey: 'userId' });
  };

  return User;
};
