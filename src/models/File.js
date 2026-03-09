'use strict';

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define(
    'File',
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
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          'property',
          'client',
          'legal',
          'financial',
          'marketing',
          'internal',
          'other'
        ),
        allowNull: true,
        defaultValue: 'other',
      },
      folderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'files', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isFolder: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'properties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      clientId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'files',
    }
  );

  File.associate = (models) => {
    File.belongsTo(models.User,     { foreignKey: 'uploadedBy',  as: 'uploader' });
    File.belongsTo(models.Property, { foreignKey: 'propertyId',  as: 'property' });
    File.belongsTo(models.Client,   { foreignKey: 'clientId',    as: 'client' });
    File.belongsTo(File,            { foreignKey: 'folderId',    as: 'folder' });
    File.hasMany(File,              { foreignKey: 'folderId',    as: 'children' });
  };

  return File;
};
