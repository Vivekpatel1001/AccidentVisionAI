export const GOOGLE_MAPS_API_KEY = 'AIzaSyAiyXTtM-9uyNKMundun3DA8IT9b8xq_HU';

export const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Bangalore': { lat: 12.9716, lng: 77.5946, zoom: 12 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946, zoom: 12 },
  'Mumbai': { lat: 19.0760, lng: 72.8777, zoom: 12 },
  'Delhi': { lat: 28.7041, lng: 77.1025, zoom: 11 },
  'Kolkata': { lat: 22.5726, lng: 88.3639, zoom: 12 },
  'Chennai': { lat: 13.0827, lng: 80.2707, zoom: 12 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, zoom: 12 },
  'Pune': { lat: 18.5204, lng: 73.8567, zoom: 12 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, zoom: 12 },
};

export const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 };

// Modern, crisp light Google Maps theme styling that matches our executive UI
export const CLEAN_LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#94A3B8' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#CBD5E1' }, { weight: 1 }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F8FAFC' }],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E2E8F0' }, { weight: 0.8 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FED7AA' }], // Subtle warm amber for highways
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#FDBA74' }, { weight: 1 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#E0F2FE' }], // Soft crisp blue water
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284C7' }],
  },
];
