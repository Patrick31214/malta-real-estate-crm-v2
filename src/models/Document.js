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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
          'agreement',
          'permit',
          'certificate',
          'report',
          'financial',
          'template',
          'correspondence',
          'other'
        ),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'signed', 'archived', 'expired'),
        allowNull: true,
        defaultValue: 'draft',
      },
      isConfidential: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      expiryDate: {
        type: DataTypes.DATEONLY,
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
      clientId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
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
    Document.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
    Document.belongsTo(models.Owner,    { foreignKey: 'ownerId',    as: 'owner' });
    Document.belongsTo(models.Client,   { foreignKey: 'clientId',   as: 'client' });
    Document.belongsTo(models.User,     { foreignKey: 'userId',     as: 'subject' });
    Document.belongsTo(models.User,     { foreignKey: 'uploadedById', as: 'uploadedBy' });
  };

  return Document;
};
