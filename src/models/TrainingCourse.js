'use strict';

module.exports = (sequelize, DataTypes) => {
  const TrainingCourse = sequelize.define(
    'TrainingCourse',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          'onboarding',
          'sales',
          'legal',
          'compliance',
          'product_knowledge',
          'soft_skills',
          'technology',
          'other'
        ),
        allowNull: false,
        defaultValue: 'other',
      },
      difficulty: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner',
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contentType: {
        type: DataTypes.ENUM('video', 'document', 'quiz', 'interactive', 'external_link'),
        allowNull: false,
        defaultValue: 'document',
      },
      contentUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      instructor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: 'training_courses',
    }
  );

  TrainingCourse.associate = (models) => {
    TrainingCourse.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    TrainingCourse.hasMany(models.TrainingProgress, { foreignKey: 'courseId', as: 'progressRecords' });
  };

  return TrainingCourse;
};
