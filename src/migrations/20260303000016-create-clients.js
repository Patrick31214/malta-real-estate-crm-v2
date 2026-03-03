'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      // Personal
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName:  { type: Sequelize.STRING, allowNull: false },
      email:     { type: Sequelize.STRING, allowNull: true },
      phone:     { type: Sequelize.STRING, allowNull: true },
      alternatePhone: { type: Sequelize.STRING, allowNull: true },
      nationality:    { type: Sequelize.STRING, allowNull: true },
      occupation:     { type: Sequelize.STRING, allowNull: true },
      idNumber:       { type: Sequelize.STRING, allowNull: true },
      dateOfBirth:    { type: Sequelize.DATEONLY, allowNull: true },
      profileImage:   { type: Sequelize.STRING, allowNull: true },
      // Living situation
      numberOfPeople:   { type: Sequelize.INTEGER, allowNull: true },
      hasChildren:      { type: Sequelize.BOOLEAN, defaultValue: false },
      numberOfChildren: { type: Sequelize.INTEGER, allowNull: true },
      childrenAges:     { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true },
      hasPets:          { type: Sequelize.BOOLEAN, defaultValue: false },
      petDetails:       { type: Sequelize.JSONB, allowNull: true },
      yearsInMalta:     { type: Sequelize.INTEGER, allowNull: true },
      currentAddress:   { type: Sequelize.TEXT, allowNull: true },
      // Property requirements
      lookingFor: {
        type: Sequelize.ENUM('sale', 'long_let', 'short_let', 'both'),
        allowNull: true,
      },
      propertyTypes:       { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      preferredLocalities: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      minBudget:      { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      maxBudget:      { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      budgetCurrency: { type: Sequelize.STRING(3), defaultValue: 'EUR' },
      minBedrooms:    { type: Sequelize.INTEGER, allowNull: true },
      maxBedrooms:    { type: Sequelize.INTEGER, allowNull: true },
      minBathrooms:   { type: Sequelize.INTEGER, allowNull: true },
      minArea:        { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      maxArea:        { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      preferredFloor:    { type: Sequelize.STRING, allowNull: true },
      mustHaveFeatures:  { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      niceToHaveFeatures:{ type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      // Internal preferences
      acceptsChildren:       { type: Sequelize.BOOLEAN, allowNull: true },
      childFriendlyRequired: { type: Sequelize.BOOLEAN, defaultValue: false },
      acceptsSharing:        { type: Sequelize.BOOLEAN, allowNull: true },
      acceptsShortLet:       { type: Sequelize.BOOLEAN, allowNull: true },
      isPetFriendly:         { type: Sequelize.BOOLEAN, allowNull: true },
      isNegotiable:          { type: Sequelize.BOOLEAN, defaultValue: false },
      acceptedAgeRange:      { type: Sequelize.JSONB, allowNull: true },
      // Viewing/timeline
      viewingAvailability: { type: Sequelize.JSONB, allowNull: true },
      moveInDate:          { type: Sequelize.DATEONLY, allowNull: true },
      moveInFlexibility: {
        type: Sequelize.ENUM('exact', 'within_2weeks', 'within_month', 'within_3months', 'flexible'),
        allowNull: true,
      },
      urgency: {
        type: Sequelize.ENUM('immediate', 'within_month', 'within_3months', 'within_6months', 'flexible'),
        allowNull: true,
      },
      // Additional
      notes:              { type: Sequelize.TEXT, allowNull: true },
      specialRequirements:{ type: Sequelize.TEXT, allowNull: true },
      referralSource:     { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM('active','matched','viewing','offer_made','contracted','completed','on_hold','inactive'),
        defaultValue: 'active',
        allowNull: false,
      },
      isVIP: { type: Sequelize.BOOLEAN, defaultValue: false },
      // FKs
      agentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Timestamps
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clients');
  },
};
