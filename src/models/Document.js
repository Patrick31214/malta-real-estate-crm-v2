'use strict';

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    'Document',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          'contract',
          'floor_plan',
          'energy_cert',
          'id_document',
          'legal',
          'photo',
          'team_photo',
          'brochure',
          'other'
        ),
        allowNull: true,
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'owners', key: 'id' },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      uploadedById: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'documents',
    }
  );

  Document.associate = (models) => {
    Document.belongsTo(models.Property, { foreignKey: 'propertyId' });
    Document.belongsTo(models.Owner, { foreignKey: 'ownerId' });
    Document.belongsTo(models.User, { foreignKey: 'userId', as: 'subject' });
    Document.belongsTo(models.User, { foreignKey: 'uploadedById', as: 'uploadedBy' });
  };

  return Document;
};
