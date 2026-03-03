'use strict';

module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    'Client',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      // Personal
      firstName:      { type: DataTypes.STRING, allowNull: false },
      lastName:       { type: DataTypes.STRING, allowNull: false },
      email:          { type: DataTypes.STRING, allowNull: true },
      phone:          { type: DataTypes.STRING, allowNull: true },
      alternatePhone: { type: DataTypes.STRING, allowNull: true },
      nationality:    { type: DataTypes.STRING, allowNull: true },
      occupation:     { type: DataTypes.STRING, allowNull: true },
      idNumber:       { type: DataTypes.STRING, allowNull: true },
      dateOfBirth:    { type: DataTypes.DATEONLY, allowNull: true },
      profileImage:   { type: DataTypes.STRING, allowNull: true },
      // Living situation
      numberOfPeople:   { type: DataTypes.INTEGER, allowNull: true },
      hasChildren:      { type: DataTypes.BOOLEAN, defaultValue: false },
      numberOfChildren: { type: DataTypes.INTEGER, allowNull: true },
      childrenAges:     { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: true },
      hasPets:          { type: DataTypes.BOOLEAN, defaultValue: false },
      petDetails:       { type: DataTypes.JSONB, allowNull: true },
      yearsInMalta:     { type: DataTypes.INTEGER, allowNull: true },
      currentAddress:   { type: DataTypes.TEXT, allowNull: true },
      // Property requirements
      lookingFor:          { type: DataTypes.ENUM('sale','long_let','short_let','both'), allowNull: true },
      propertyTypes:       { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      preferredLocalities: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      minBudget:           { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      maxBudget:           { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      budgetCurrency:      { type: DataTypes.STRING(3), defaultValue: 'EUR' },
      minBedrooms:         { type: DataTypes.INTEGER, allowNull: true },
      maxBedrooms:         { type: DataTypes.INTEGER, allowNull: true },
      minBathrooms:        { type: DataTypes.INTEGER, allowNull: true },
      minArea:             { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      maxArea:             { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      preferredFloor:      { type: DataTypes.STRING, allowNull: true },
      mustHaveFeatures:    { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      niceToHaveFeatures:  { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      // Viewing/timeline
      viewingAvailability: { type: DataTypes.JSONB, allowNull: true },
      moveInDate:          { type: DataTypes.DATEONLY, allowNull: true },
      moveInFlexibility:   { type: DataTypes.ENUM('exact','within_2weeks','within_month','within_3months','flexible'), allowNull: true },
      urgency:             { type: DataTypes.ENUM('immediate','within_month','within_3months','within_6months','flexible'), allowNull: true },
      // Additional
      notes:              { type: DataTypes.TEXT, allowNull: true },
      specialRequirements:{ type: DataTypes.TEXT, allowNull: true },
      referralSource:     { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('active','matched','viewing','offer_made','contracted','completed','on_hold','inactive'),
        defaultValue: 'active',
        allowNull: false,
      },
      isVIP:    { type: DataTypes.BOOLEAN, defaultValue: false },
      deletedAt:{ type: DataTypes.DATE, allowNull: true },
      // FKs
      agentId:  { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      branchId: { type: DataTypes.UUID, allowNull: true, references: { model: 'branches', key: 'id' } },
    },
    { tableName: 'clients', paranoid: true }
  );

  Client.associate = (models) => {
    Client.belongsTo(models.User,   { foreignKey: 'agentId',  as: 'agent' });
    Client.belongsTo(models.Branch, { foreignKey: 'branchId' });
    Client.hasMany(models.ClientMatch, { foreignKey: 'clientId', as: 'matches' });
  };

  return Client;
};
