'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `WITH numbered AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
          FROM properties
        )
        UPDATE properties
        SET "referenceNumber" = 'PROP-' || LPAD(numbered.rn::text, 4, '0')
        FROM numbered
        WHERE properties.id = numbered.id`,
        { transaction: t }
      );
    });
  },

  async down(queryInterface) {
    // Irreversible — cannot restore original CSV-sourced reference numbers
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE properties SET "referenceNumber" = NULL`,
        { transaction: t }
      );
    });
  },
};
