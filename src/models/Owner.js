'use strict';

module.exports = (sequelize, DataTypes) => {
  const Owner = sequelize.define(
    'Owner',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      referenceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alternatePhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      idNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nationality: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      preferredLanguage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      taxId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'owners',
      hooks: {
        beforeCreate: async (owner) => {
          if (!owner.referenceNumber) {
            const last = await Owner.findOne({
              where: sequelize.where(
                sequelize.fn('LEFT', sequelize.col('referenceNumber'), 4),
                'OWN-'
              ),
              order: [['referenceNumber', 'DESC']],
              attributes: ['referenceNumber'],
              lock: true,
            });
            let nextNum = 1;
            if (last && last.referenceNumber) {
              const parsed = parseInt(last.referenceNumber.replace('OWN-', ''), 10);
              if (!isNaN(parsed)) nextNum = parsed + 1;
            }
            owner.referenceNumber = `OWN-${String(nextNum).padStart(4, '0')}`;
          }
        },
      },
    }
  );

  Owner.associate = (models) => {
    Owner.hasMany(models.Property, { foreignKey: 'ownerId' });
    Owner.hasMany(models.Document, { foreignKey: 'ownerId' });
    Owner.hasMany(models.OwnerContact, { foreignKey: 'ownerId', as: 'contacts' });
  };

  return Owner;
};
