'use strict';

const PROPERTY_FEATURES = {
  'Outdoor & Views': [
    'Sea View', 'Sea Front', 'Country View', 'City View', 'Pool View',
    'Garden View', 'Harbor View', 'Valley View',
    'Private Pool', 'Communal Pool', 'Roof Pool',
    'Private Garden', 'Communal Garden', 'Terrace', 'Balcony',
    'Roof Terrace', 'Yard', 'BBQ Area', 'Outdoor Shower',
  ],
  'Interior': [
    'Air Conditioning', 'Central Heating', 'Fireplace', 'Jacuzzi',
    'Walk-in Closet', 'En-suite Bathroom', 'Guest Toilet',
    'Laundry Room', 'Storage Room', 'Wine Cellar', 'Home Office',
    'Open Plan Kitchen', 'Separate Kitchen', 'Fitted Kitchen',
    'Furnished', 'Part Furnished', 'Smart Home System',
  ],
  'Building & Amenities': [
    'Lift', 'Concierge', 'Gym', 'Spa', 'Sauna',
    'Common Room', 'Playroom', 'CCTV', 'Intercom', 'Alarm System',
    'Electric Shutters', 'Double Glazing', 'Solar Panels',
    'Water Tank', 'Borehole', 'Generator',
  ],
  'Parking': [
    'Garage', 'Car Space', 'Underground Parking', 'Street Parking',
    'Multiple Car Spaces', 'Boat Garage',
  ],
  'Neighborhood': [
    'Quiet Neighborhood', 'Close to Seafront',
    'Close to Schools', 'Close to Shops', 'Close to Bus Route',
    'Close to Hospital', 'Close to Airport', 'Gated Community',
  ],
  'Property Specifics': [
    'Corner Property', 'Detached', 'Semi-Detached', 'New Build',
    'Off Plan', 'Converted', 'Listed Building', 'Pet Friendly',
    'Wheelchair Accessible', 'Eco-Friendly', 'Investment Property',
    'Holiday Let License', 'Needs Renovation',
  ],
};

const ALL_FEATURES = Object.values(PROPERTY_FEATURES).flat();

const CATEGORY_ICONS = {
  'Outdoor & Views': '🌊',
  'Interior': '🏠',
  'Building & Amenities': '🏢',
  'Parking': '🅿️',
  'Neighborhood': '📍',
  'Property Specifics': '🏗️',
};

module.exports = { PROPERTY_FEATURES, ALL_FEATURES, CATEGORY_ICONS };
