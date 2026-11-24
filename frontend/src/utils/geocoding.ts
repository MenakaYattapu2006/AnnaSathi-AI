/**
 * Accurately determines whether a location/city/pincode belongs to Andhra Pradesh or Telangana.
 */
export function resolveStateFromLocation(locationText: string, pincode?: string): string {
  const text = `${locationText || ''} ${pincode || ''}`.toLowerCase();

  // Explicit mention
  if (text.includes('andhra') || text.includes('ap')) return 'Andhra Pradesh';
  if (text.includes('telangana') || text.includes('ts')) return 'Telangana';

  // Known Andhra Pradesh cities, towns, and regions
  const apKeywords = [
    'veeravasaram', 'nandamurugaruvu', 'surampalem', 'aditya', 'kakinada', 'rajahmundry',
    'rajamahendravaram', 'bhimavaram', 'palakollu', 'tanuku', 'narsapur', 'tadepalligudem',
    'eluru', 'vijayawada', 'guntur', 'visakhapatnam', 'vizag', 'tirupati', 'nellore',
    'kurnool', 'anantapur', 'kadapa', 'proddatur', 'chittoor', 'ongole', 'srikakulam',
    'vizianagaram', 'machilipatnam', 'tenali', 'samalkot', 'peddapuram', 'amalapuram'
  ];

  for (const kw of apKeywords) {
    if (text.includes(kw)) {
      return 'Andhra Pradesh';
    }
  }

  // Pincode prefixes: 53xxxx (Coastal AP, Godavari, Vizag), 51xxxx / 52xxxx (Rayalaseema & Coastal AP)
  const pin = (pincode || '').trim();
  if (pin.length === 6 && /^\d+$/.test(pin)) {
    // 50xxxx is mostly Telangana (Hyderabad, Rangareddy, Warangal)
    if (pin.startsWith('50')) return 'Telangana';
    // 51xxxx, 52xxxx, 53xxxx are Andhra Pradesh
    if (pin.startsWith('51') || pin.startsWith('52') || pin.startsWith('53')) return 'Andhra Pradesh';
  }

  // Known Telangana cities
  const tsKeywords = [
    'hyderabad', 'secunderabad', 'warangal', 'karimnagar', 'khammam', 'nizamabad',
    'mahbubnagar', 'nalgonda', 'adilabad', 'ramagundam', 'siddipet', 'medak',
    'rangareddy', 'hitec city', 'gachibowli', 'madhapur', 'banjara hills', 'jubilee hills'
  ];

  for (const kw of tsKeywords) {
    if (text.includes(kw)) {
      return 'Telangana';
    }
  }

  return 'Andhra Pradesh';
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  displayName?: string;
}

// Built-in high-precision dictionary of known campuses, towns, and cities
// Instant, zero-latency, works 100% offline
const LOCAL_GEO_CACHE: Record<string, GeoLocation> = {
  // Surampalem & Aditya Campuses (East Godavari, AP)
  'aditya university': { latitude: 17.0878, longitude: 82.0668, displayName: 'Aditya University, Surampalem' },
  'aditya engineering college': { latitude: 17.0878, longitude: 82.0668, displayName: 'Aditya Engineering College, Surampalem' },
  'surampalem': { latitude: 17.0878, longitude: 82.0668, displayName: 'Surampalem, Andhra Pradesh' },
  'aditya': { latitude: 17.0878, longitude: 82.0668, displayName: 'Aditya Campus, Surampalem' },

  // West Godavari & Coastal AP
  'veeravasaram': { latitude: 16.5378, longitude: 81.6233, displayName: 'Veeravasaram, West Godavari' },
  'nandamurugaruvu': { latitude: 16.5378, longitude: 81.6233, displayName: 'Nandamurugaruvu, Veeravasaram' },
  'bhimavaram': { latitude: 16.5449, longitude: 81.5212, displayName: 'Bhimavaram, Andhra Pradesh' },
  'palakollu': { latitude: 16.5273, longitude: 81.7337, displayName: 'Palakollu, Andhra Pradesh' },
  'tanuku': { latitude: 16.7570, longitude: 81.6811, displayName: 'Tanuku, Andhra Pradesh' },
  'narsapur': { latitude: 16.4357, longitude: 81.6961, displayName: 'Narsapur, Andhra Pradesh' },
  'tadepalligudem': { latitude: 16.8126, longitude: 81.5262, displayName: 'Tadepalligudem, Andhra Pradesh' },
  'eluru': { latitude: 16.7107, longitude: 81.0952, displayName: 'Eluru, Andhra Pradesh' },

  // East Godavari & Kakinada
  'kakinada': { latitude: 16.9891, longitude: 82.2475, displayName: 'Kakinada, Andhra Pradesh' },
  'rajahmundry': { latitude: 17.0005, longitude: 81.8040, displayName: 'Rajahmundry, Andhra Pradesh' },
  'rajamahendravaram': { latitude: 17.0005, longitude: 81.8040, displayName: 'Rajamahendravaram, Andhra Pradesh' },
  'peddapuram': { latitude: 17.0805, longitude: 82.1388, displayName: 'Peddapuram, Andhra Pradesh' },
  'samalkot': { latitude: 17.0544, longitude: 82.1706, displayName: 'Samalkot, Andhra Pradesh' },
  'amalapuram': { latitude: 16.5787, longitude: 82.0061, displayName: 'Amalapuram, Andhra Pradesh' },

  // Other Major AP Hubs
  'vijayawada': { latitude: 16.5062, longitude: 80.6480, displayName: 'Vijayawada, Andhra Pradesh' },
  'visakhapatnam': { latitude: 17.6868, longitude: 83.2185, displayName: 'Visakhapatnam, Andhra Pradesh' },
  'vizag': { latitude: 17.6868, longitude: 83.2185, displayName: 'Visakhapatnam, Andhra Pradesh' },
  'guntur': { latitude: 16.3067, longitude: 80.4365, displayName: 'Guntur, Andhra Pradesh' },
  'tirupati': { latitude: 13.6288, longitude: 79.4192, displayName: 'Tirupati, Andhra Pradesh' },
  'nellore': { latitude: 14.4426, longitude: 79.9865, displayName: 'Nellore, Andhra Pradesh' },
  'kurnool': { latitude: 15.8281, longitude: 78.0373, displayName: 'Kurnool, Andhra Pradesh' },

  // Telangana
  'hyderabad': { latitude: 17.3850, longitude: 78.4867, displayName: 'Hyderabad, Telangana' },
  'secunderabad': { latitude: 17.4399, longitude: 78.4983, displayName: 'Secunderabad, Telangana' },
  'banjara hills': { latitude: 17.4156, longitude: 78.4357, displayName: 'Banjara Hills, Hyderabad' },
  'jubilee hills': { latitude: 17.4319, longitude: 78.4073, displayName: 'Jubilee Hills, Hyderabad' },
  'hitec city': { latitude: 17.4435, longitude: 78.3772, displayName: 'HITEC City, Hyderabad' },
  'gachibowli': { latitude: 17.4401, longitude: 78.3489, displayName: 'Gachibowli, Hyderabad' },
  'madhapur': { latitude: 17.4483, longitude: 78.3915, displayName: 'Madhapur, Hyderabad' },
  'warangal': { latitude: 17.9689, longitude: 79.5941, displayName: 'Warangal, Telangana' },
  'karimnagar': { latitude: 18.4386, longitude: 79.1288, displayName: 'Karimnagar, Telangana' },
  'nizamabad': { latitude: 18.6725, longitude: 78.0941, displayName: 'Nizamabad, Telangana' },
  'khammam': { latitude: 17.2473, longitude: 80.1514, displayName: 'Khammam, Telangana' },

  // Major Metros
  'bengaluru': { latitude: 12.9716, longitude: 77.5946, displayName: 'Bengaluru, Karnataka' },
  'bangalore': { latitude: 12.9716, longitude: 77.5946, displayName: 'Bengaluru, Karnataka' },
  'chennai': { latitude: 13.0827, longitude: 80.2707, displayName: 'Chennai, Tamil Nadu' },
  'delhi': { latitude: 28.6139, longitude: 77.2090, displayName: 'New Delhi' },
  'mumbai': { latitude: 19.0760, longitude: 72.8777, displayName: 'Mumbai, Maharashtra' },
};

// Memory cache for runtime Nominatim queries
const RUNTIME_CACHE = new Map<string, GeoLocation>();

/**
 * Check if the given coordinates appear to be dummy/placeholder defaults
 * (i.e. Banjara Hills 17.4156/78.4357 or Charminar 17.3850/78.4867 when the address is NOT in Hyderabad)
 */
export function isPlaceholderCoordinate(
  lat: number | undefined,
  lng: number | undefined,
  addressText?: string
): boolean {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return true;
  }

  // Exact dummy values used throughout platform seeds
  const isDefaultDonorCoords = Math.abs(lat - 17.4156) < 0.0005 && Math.abs(lng - 78.4357) < 0.0005;
  const isDefaultNgoCoords = Math.abs(lat - 17.3850) < 0.0005 && Math.abs(lng - 78.4867) < 0.0005;

  if (isDefaultDonorCoords || isDefaultNgoCoords) {
    // If the address text clearly points to somewhere outside Hyderabad (e.g. Surampalem, Veeravasaram, Kakinada),
    // treat the Hyderabad coordinates as an inaccurate placeholder
    if (addressText) {
      const lower = addressText.toLowerCase();
      const isActuallyHyderabad = lower.includes('hyderabad') || lower.includes('secunderabad') || lower.includes('telangana');
      if (!isActuallyHyderabad) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Resolve geographical coordinates for a given address.
 * 1. Checks if explicit coordinates provided are valid (and not dummy placeholders for another city).
 * 2. Checks high-speed local dictionary for matching city/campus/town keywords.
 * 3. Falls back to OpenStreetMap Nominatim API if online.
 * 4. Falls back to provided coordinates or standard city coordinates if all else fails.
 */
export async function resolveAddressCoordinates(
  address: string,
  providedLat?: number,
  providedLng?: number
): Promise<GeoLocation> {
  const clean = (address || '').trim().toLowerCase();

  // If explicit coords are provided and ARE NOT placeholder defaults, use them
  if (
    providedLat != null &&
    providedLng != null &&
    !isNaN(providedLat) &&
    !isNaN(providedLng) &&
    !isPlaceholderCoordinate(providedLat, providedLng, clean)
  ) {
    return { latitude: providedLat, longitude: providedLng };
  }

  // 1. Check local dictionary
  for (const [key, loc] of Object.entries(LOCAL_GEO_CACHE)) {
    if (clean.includes(key)) {
      return loc;
    }
  }

  // 2. Check runtime memory cache
  if (RUNTIME_CACHE.has(clean)) {
    return RUNTIME_CACHE.get(clean)!;
  }

  // 3. Online OpenStreetMap Nominatim query with timeout
  if (typeof window !== 'undefined' && clean.length > 2) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Clean query string: extract key address parts, prioritize city and street
      const queryParts = clean
        .replace(/near\s+[^,]+/gi, '')
        .replace(/opposite\s+[^,]+/gi, '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const searchQuery = queryParts.slice(-2).join(', ') || clean;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const result: GeoLocation = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            displayName: data[0].display_name,
          };
          RUNTIME_CACHE.set(clean, result);
          return result;
        }
      }
    } catch {
      // Offline or network timeout, fall through to fallback
    }
  }

  // 4. Fallback to provided coordinates if valid, else default Hyderabad
  return {
    latitude: providedLat && !isNaN(providedLat) ? providedLat : 17.3850,
    longitude: providedLng && !isNaN(providedLng) ? providedLng : 78.4867,
  };
}
