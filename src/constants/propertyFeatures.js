'use strict';

const PROPERTY_FEATURES = {
  'Outdoor & Views': [
    'Sea View', 'Sea Front', 'Country View', 'City View', 'Pool View',
    'Garden View', 'Harbor View', 'Valley View',
    'Private Pool', 'Communal Pool', 'Roof Pool',
    'Private Garden', 'Communal Garden', 'Terrace', 'Balcony',
    'Roof Terrace', 'Yard', 'BBQ Area', 'Outdoor Shower',
    'Panoramic View', 'Bastions View', 'Countryside View',
  ],
  'Interior': [
    'Air Conditioning', 'Central Heating', 'Fireplace', 'Jacuzzi',
    'Walk-in Closet', 'En-suite Bathroom', 'Guest Toilet',
    'Laundry Room', 'Storage Room', 'Wine Cellar', 'Home Office',
    'Open Plan Kitchen', 'Separate Kitchen', 'Fitted Kitchen',
    'Furnished', 'Part Furnished', 'Smart Home System',
    'Maltese Tiles', 'Stone Walls', 'Wooden Beams', 'High Ceilings',
  ],
  'Building & Amenities': [
    'Lift', 'Concierge', 'Gym', 'Spa', 'Sauna',
    'Common Room', 'Playroom', 'CCTV', 'Intercom', 'Alarm System',
    'Electric Shutters', 'Double Glazing', 'Solar Panels',
    'Water Tank', 'Borehole', 'Generator',
    'Domestic Quarters', 'Staff Room',
  ],
  'Parking': [
    'Garage', 'Car Space', 'Underground Parking', 'Street Parking',
    'Multiple Car Spaces', 'Boat Garage',
  ],
  'Neighborhood': [
    'Quiet Neighborhood', 'Close to Seafront',
    'Close to Schools', 'Close to Shops', 'Close to Bus Route',
    'Close to Hospital', 'Close to Airport', 'Gated Community',
    'Close to Ferry', 'Close to Promenade', 'Close to Church', 'Sliema/St Julians Area', 'Gozo',
  ],
  'Property Specifics': [
    'Corner Property', 'Detached', 'Semi-Detached', 'New Build',
    'Off Plan', 'Converted', 'Listed Building', 'Pet Friendly',
    'Wheelchair Accessible', 'Eco-Friendly', 'Investment Property',
    'Holiday Let License', 'Needs Renovation',
    'UCA Zone', 'Scheduled Property', 'Character Property', 'With Permits', 'Airspace Available',
  ],
  'Kitchen Appliances': [
    'fridge', 'freezer', 'fridge_freezer', 'induction_hob', 'gas_hob',
    'electric_hob', 'ceramic_hob', 'oven', 'microwave', 'toaster',
    'kettle', 'coffee_machine', 'dishwasher', 'blender', 'food_processor',
    'rice_cooker', 'slow_cooker', 'air_fryer', 'wine_cooler',
    'water_dispenser', 'ice_maker', 'extractor_hood',
  ],
  'Laundry': [
    'washing_machine', 'tumble_dryer', 'washer_dryer_combo',
    'ironing_board', 'iron', 'clothes_airer', 'laundry_room',
  ],
  'Bathroom': [
    'bathtub', 'shower', 'walk_in_shower', 'rain_shower', 'bidet',
    'hair_dryer', 'underfloor_heating_bathroom', 'heated_towel_rail',
    'jacuzzi', 'double_sink', 'mirror_cabinet',
  ],
  'Bedroom / Linen': [
    'bed_linen_provided', 'towels_provided', 'extra_pillows',
    'mattress_protector', 'wardrobe', 'walk_in_wardrobe',
    'built_in_wardrobes', 'chest_of_drawers', 'bedside_tables',
    'dressing_table', 'king_size_bed', 'queen_size_bed',
    'single_beds', 'sofa_bed', 'bunk_beds',
  ],
  'Living / Dining': [
    'dining_area', 'dining_table', 'dining_chairs', 'sofa', 'armchair',
    'coffee_table', 'bookshelf', 'tv_unit', 'desk', 'office_chair',
    'fireplace', 'study_room',
  ],
  'Entertainment / Tech': [
    'smart_tv', 'cable_tv', 'satellite_tv', 'netflix', 'streaming_services',
    'wifi', 'high_speed_internet', 'bluetooth_speaker', 'sound_system',
    'gaming_console', 'projector',
  ],
  'Heating / Cooling': [
    'air_conditioning', 'central_heating', 'underfloor_heating',
    'gas_heating', 'electric_heaters', 'ceiling_fans', 'portable_fans',
    'dehumidifier', 'humidifier',
  ],
  'Safety / Security': [
    'smoke_detector', 'carbon_monoxide_detector', 'fire_extinguisher',
    'first_aid_kit', 'safe', 'security_alarm', 'cctv', 'intercom',
    'doorbell_camera', 'security_door', 'window_bars', 'gated_community',
  ],
  'Outdoor / Building': [
    'balcony', 'terrace', 'roof_terrace', 'garden', 'private_garden',
    'shared_garden', 'patio', 'bbq_area', 'outdoor_furniture',
    'outdoor_dining', 'swimming_pool', 'shared_pool', 'private_pool',
    'rooftop_pool', 'hot_tub', 'sun_loungers', 'parking', 'garage',
    'covered_parking', 'car_port', 'bicycle_storage', 'ev_charging',
    'playground', 'dog_park',
  ],
  'Building Amenities': [
    'lift', 'elevator', 'concierge', 'doorman', 'reception', 'gym',
    'fitness_center', 'spa', 'sauna', 'steam_room', 'communal_lounge',
    'co_working_space', 'meeting_room', 'rooftop_access', 'storage_room',
    'wine_cellar', 'cinema_room',
  ],
  'General': [
    'furnished', 'semi_furnished', 'unfurnished', 'newly_renovated',
    'sea_view', 'country_view', 'city_view', 'pool_view', 'garden_view',
    'harbor_view', 'quiet_area', 'wheelchair_accessible', 'pet_friendly',
    'child_friendly', 'student_friendly', 'smoking_allowed', 'no_smoking',
  ],
  'Utility': [
    'water_tank', 'solar_panels', 'solar_water_heater', 'generator',
    'backup_power', 'water_softener', 'reverse_osmosis', 'fibre_optic',
    'separate_meters', 'prepaid_meters',
  ],
  'Malta Specific': [
    'Converted Farmhouse', 'Palazzo', 'House of Character',
    'Townhouse', 'Penthouse', 'Maisonette',
    'Razzett', 'Boathouse', 'Garage Lock-up',
    'Band Club Nearby', 'Festa Area',
    'Near Dive Sites', 'Near Yacht Marina',
    'Government Scheme Eligible', 'First Time Buyer Eligible',
    'Sliema Ferries Walking Distance', 'Valletta Walking Distance',
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
  'Kitchen Appliances': '🍳',
  'Laundry': '🧺',
  'Bathroom': '🚿',
  'Bedroom / Linen': '🛏️',
  'Living / Dining': '🛋️',
  'Entertainment / Tech': '📺',
  'Heating / Cooling': '🌡️',
  'Safety / Security': '🔒',
  'Outdoor / Building': '🌿',
  'Building Amenities': '🏛️',
  'General': '✨',
  'Utility': '⚡',
  'Malta Specific': '🇲🇹',
};

module.exports = { PROPERTY_FEATURES, ALL_FEATURES, CATEGORY_ICONS };
