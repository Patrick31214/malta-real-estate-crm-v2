'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('services', [
      {
        id: uuidv4(),
        name: 'Sunset Boat Trip',
        description:
          'Experience Malta from the water with our stunning sunset boat trip around the Grand Harbour and Valletta bastions. Includes drinks and snacks.',
        category: 'boat',
        price: 75.0,
        currency: 'EUR',
        duration: '3 hours',
        images: '{}',
        heroImage: null,
        isActive: true,
        isFeatured: true,
        contactPhone: '+356 9900 1122',
        contactEmail: 'boats@goldenkey.mt',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Car Rental — Economy',
        description:
          'Rent a compact car to explore Malta at your own pace. Includes insurance and unlimited mileage. Minimum 3-day rental.',
        category: 'car_rental',
        price: 35.0,
        currency: 'EUR',
        duration: 'Per day',
        images: '{}',
        heroImage: null,
        isActive: true,
        isFeatured: false,
        contactPhone: '+356 9900 2233',
        contactEmail: 'cars@goldenkey.mt',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Half-Day Island Tour',
        description:
          "Guided tour of Malta's top attractions: Mdina, the Silent City; Dingli Cliffs; Mosta Dome; and the Rotunda of Xewkija in Gozo.",
        category: 'tour',
        price: 45.0,
        currency: 'EUR',
        duration: '4 hours',
        images: '{}',
        heroImage: null,
        isActive: true,
        isFeatured: true,
        contactPhone: '+356 9900 3344',
        contactEmail: 'tours@goldenkey.mt',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Airport Transfer',
        description:
          'Comfortable and reliable airport transfers to/from Malta International Airport. Available 24/7. Suitable for up to 4 passengers.',
        category: 'transfer',
        price: 25.0,
        currency: 'EUR',
        duration: 'One way',
        images: '{}',
        heroImage: null,
        isActive: true,
        isFeatured: false,
        contactPhone: '+356 9900 4455',
        contactEmail: 'transfers@goldenkey.mt',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Scooter Rental',
        description:
          'Explore Malta on a 125cc scooter. Helmet included. Full insurance provided. Valid licence required.',
        category: 'motorcycle_rental',
        price: 28.0,
        currency: 'EUR',
        duration: 'Per day',
        images: '{}',
        heroImage: null,
        isActive: true,
        isFeatured: false,
        contactPhone: '+356 9900 5566',
        contactEmail: 'scooters@goldenkey.mt',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('services', {
      contactEmail: [
        'boats@goldenkey.mt',
        'cars@goldenkey.mt',
        'tours@goldenkey.mt',
        'transfers@goldenkey.mt',
        'scooters@goldenkey.mt',
      ],
    });
  },
};
