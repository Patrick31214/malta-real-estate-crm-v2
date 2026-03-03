'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserPermission = sequelize.define(
    'UserPermission',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      feature: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      grantedById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'user_permissions',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'feature'],
        },
      ],
    }
  );

  UserPermission.associate = (models) => {
    UserPermission.belongsTo(models.User, { foreignKey: 'userId' });
    UserPermission.belongsTo(models.User, { foreignKey: 'grantedById', as: 'grantedBy' });
  };

  return UserPermission;
};
