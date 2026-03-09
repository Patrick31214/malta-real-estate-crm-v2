'use strict';

module.exports = (sequelize, DataTypes) => {
  const TrainingProgress = sequelize.define(
    'TrainingProgress',
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      courseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'training_courses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'not_started',
      },
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'training_progress',
    }
  );

  TrainingProgress.associate = (models) => {
    TrainingProgress.belongsTo(models.User,           { foreignKey: 'userId',   as: 'user' });
    TrainingProgress.belongsTo(models.TrainingCourse, { foreignKey: 'courseId', as: 'course' });
  };

  return TrainingProgress;
};
