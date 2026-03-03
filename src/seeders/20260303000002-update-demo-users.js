'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Fetch branches
    const branches = await queryInterface.sequelize.query(
      'SELECT id, email FROM branches WHERE email IN (:emails)',
      {
        replacements: {
          emails: ['sliema@goldenkey.mt', 'valletta@goldenkey.mt', 'stjulians@goldenkey.mt'],
        },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const branchMap = {};
    for (const b of branches) {
      branchMap[b.email] = b.id;
    }

    // Fetch existing demo users
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM users WHERE email IN (:emails)',
      {
        replacements: {
          emails: [
            'admin@goldenkey.mt',
            'manager@goldenkey.mt',
            'agent@goldenkey.mt',
          ],
        },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const userMap = {};
    for (const u of users) {
      userMap[u.email] = u.id;
    }

    // Update admin
    if (userMap['admin@goldenkey.mt']) {
      await queryInterface.sequelize.query(
        `UPDATE users SET
          "branchId" = :branchId,
          bio = :bio,
          "profileImage" = :profileImage,
          "licenseNumber" = :licenseNumber,
          "updatedAt" = :updatedAt
        WHERE id = :id`,
        {
          replacements: {
            id: userMap['admin@goldenkey.mt'],
            branchId: branchMap['sliema@goldenkey.mt'],
            bio: 'Director and founder of Golden Key Realty. Over 20 years experience in Maltese real estate.',
            profileImage: null,
            licenseNumber: 'EIRA-ADM-001',
            updatedAt: now,
          },
        }
      );
    }

    // Update manager
    if (userMap['manager@goldenkey.mt']) {
      await queryInterface.sequelize.query(
        `UPDATE users SET
          "branchId" = :branchId,
          bio = :bio,
          "profileImage" = :profileImage,
          "licenseNumber" = :licenseNumber,
          "updatedAt" = :updatedAt
        WHERE id = :id`,
        {
          replacements: {
            id: userMap['manager@goldenkey.mt'],
            branchId: branchMap['valletta@goldenkey.mt'],
            bio: 'Operations Manager at Golden Key Realty Valletta Office. Specialising in commercial and residential sales.',
            profileImage: null,
            licenseNumber: 'EIRA-MGR-002',
            updatedAt: now,
          },
        }
      );
    }

    // Update agent
    if (userMap['agent@goldenkey.mt']) {
      await queryInterface.sequelize.query(
        `UPDATE users SET
          "branchId" = :branchId,
          bio = :bio,
          "profileImage" = :profileImage,
          "licenseNumber" = :licenseNumber,
          specializations = ARRAY['residential', 'luxury', 'long_let'],
          languages = ARRAY['English', 'Maltese', 'Italian'],
          "commissionRate" = 2.50,
          "updatedAt" = :updatedAt
        WHERE id = :id`,
        {
          replacements: {
            id: userMap['agent@goldenkey.mt'],
            branchId: branchMap['stjulians@goldenkey.mt'],
            bio: 'Senior property consultant specialising in luxury residential properties across St Julian\'s and Sliema.',
            profileImage: null,
            licenseNumber: 'EIRA-AGT-003',
            updatedAt: now,
          },
        }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE users SET
        "branchId" = NULL,
        bio = NULL,
        "profileImage" = NULL,
        "licenseNumber" = NULL,
        specializations = NULL,
        languages = NULL,
        "commissionRate" = NULL
      WHERE email IN ('admin@goldenkey.mt', 'manager@goldenkey.mt', 'agent@goldenkey.mt')`
    );
  },
};
