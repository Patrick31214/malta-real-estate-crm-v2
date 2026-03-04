'use strict';

module.exports = {
  async up(queryInterface) {
    // Skip if referenceNumber column doesn't exist yet
    const tableDesc = await queryInterface.describeTable('properties');
    if (!tableDesc.referenceNumber) return;

    // Find the highest existing PROP-NNNN number to avoid gaps/conflicts
    const [maxRows] = await queryInterface.sequelize.query(
      `SELECT "referenceNumber" FROM properties
       WHERE "referenceNumber" ~ '^PROP-[0-9]+$'
       ORDER BY "referenceNumber" DESC
       LIMIT 1`
    );
    let nextNum = 1;
    if (maxRows.length > 0 && maxRows[0].referenceNumber) {
      const m = maxRows[0].referenceNumber.match(/PROP-(\d+)/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }

    // Fetch properties without a reference number, ordered by creation date
    const [nullRows] = await queryInterface.sequelize.query(
      `SELECT id FROM properties WHERE "referenceNumber" IS NULL ORDER BY "createdAt" ASC`
    );

    for (const row of nullRows) {
      const ref = `PROP-${String(nextNum).padStart(4, '0')}`;
      await queryInterface.sequelize.query(
        `UPDATE properties SET "referenceNumber" = :ref WHERE id = :id AND "referenceNumber" IS NULL`,
        { replacements: { ref, id: row.id } }
      );
      nextNum++;
    }
  },

  async down() {
    // Not reversible — reference numbers are not removed on rollback
  },
};
