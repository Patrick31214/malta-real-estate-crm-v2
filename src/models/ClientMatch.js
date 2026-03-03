'use strict';

module.exports = (sequelize, DataTypes) => {
  const ClientMatch = sequelize.define(
    'ClientMatch',
    {
      id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      clientId:       { type: DataTypes.UUID, allowNull: false, references: { model: 'clients', key: 'id' } },
      propertyId:     { type: DataTypes.UUID, allowNull: false, references: { model: 'properties', key: 'id' } },
      matchScore:     { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      matchBreakdown: { type: DataTypes.JSONB, allowNull: true },
      status: {
        type: DataTypes.ENUM('new','sent','viewed','interested','not_interested','viewing_scheduled','offer_made','rejected'),
        defaultValue: 'new',
      },
      agentNotes:       { type: DataTypes.TEXT, allowNull: true },
      lastCalculatedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'client_matches' }
  );

  ClientMatch.associate = (models) => {
    ClientMatch.belongsTo(models.Client,   { foreignKey: 'clientId' });
    ClientMatch.belongsTo(models.Property, { foreignKey: 'propertyId' });
  };

  return ClientMatch;
};
