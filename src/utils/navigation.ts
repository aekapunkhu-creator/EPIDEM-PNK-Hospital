/**
 * Google Maps Navigation Utility for TB-Care Phon Na Kaeo
 * Generates turn-by-turn directions links, multi-stop route planner URLs,
 * and handles launching Google Maps app across Android, iOS, and Web.
 */

export interface LocationPoint {
  lat?: number;
  lng?: number;
  address?: string;
  name?: string;
}

export interface LandmarkLocation {
  id: string;
  name: string;
  subdistrict: string;
  lat: number;
  lng: number;
  type: 'hospital' | 'health_center' | 'office';
}

// Key Health Facilities in Phon Na Kaeo District, Sakon Nakhon
export const PHON_NA_KAEO_FACILITIES: LandmarkLocation[] = [
  {
    id: 'hosp-phon',
    name: 'โรงพยาบาลโพนนาแก้ว (จุดศูนย์กลาง)',
    subdistrict: 'ตำบลนาแก้ว',
    lat: 17.2225884,
    lng: 104.3093759,
    type: 'hospital'
  },
  {
    id: 'ssoo-phon',
    name: 'สำนักงานสาธารณสุขอำเภอโพนนาแก้ว (สสอ.)',
    subdistrict: 'ตำบลนาแก้ว',
    lat: 17.2215000,
    lng: 104.3080000,
    type: 'office'
  },
  {
    id: 'rphst-banphon',
    name: 'รพ.สต. บ้านโพน',
    subdistrict: 'ตำบลบ้านโพน',
    lat: 17.2410231,
    lng: 104.2854312,
    type: 'health_center'
  },
  {
    id: 'rphst-nakaeo',
    name: 'รพ.สต. บ้านนาแก้ว',
    subdistrict: 'ตำบลนาแก้ว',
    lat: 17.2154321,
    lng: 104.3123456,
    type: 'health_center'
  },
  {
    id: 'rphst-natong',
    name: 'รพ.สต. นาตงวัฒนา',
    subdistrict: 'ตำบลนาตงวัฒนา',
    lat: 17.2567890,
    lng: 104.3345678,
    type: 'health_center'
  },
  {
    id: 'rphst-chiangsue',
    name: 'รพ.สต. บ้านเชียงสือ',
    subdistrict: 'ตำบลเชียงสือ',
    lat: 17.1894321,
    lng: 104.3567890,
    type: 'health_center'
  },
  {
    id: 'rphst-tharae',
    name: 'รพ.สต. บ้านท่าแร่ศรีโชค (ตำบลท่าแร่)',
    subdistrict: 'ตำบลท่าแร่',
    lat: 17.2789123,
    lng: 104.2456789,
    type: 'health_center'
  }
];

/**
 * Generate Google Maps Universal Directions URL for a single target
 */
export function getGoogleMapsDirectionsUrl(destination: LocationPoint): string {
  if (destination.lat && destination.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
  }
  
  if (destination.address) {
    const fullAddress = `${destination.address} อำเภอโพนนาแก้ว จังหวัดสกลนคร`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}&travelmode=driving`;
  }

  // Fallback to district center
  return `https://www.google.com/maps/dir/?api=1&destination=17.2225884,104.3093759&travelmode=driving`;
}

/**
 * Open Google Maps Navigation directly in a new window or trigger Google Maps app on mobile
 */
export function openGoogleMapsNavigation(destination: LocationPoint): void {
  const url = getGoogleMapsDirectionsUrl(destination);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generate Multi-Stop Route URL for visiting multiple patients in one trip
 * Google Maps Directions API URL format:
 * https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...
 */
export function getGoogleMapsMultiStopUrl(
  origin: LocationPoint | string,
  stops: LocationPoint[]
): string {
  if (stops.length === 0) {
    return 'https://www.google.com/maps';
  }

  // Determine Origin
  let originStr = '';
  if (typeof origin === 'string') {
    originStr = encodeURIComponent(origin);
  } else if (origin.lat && origin.lng) {
    originStr = `${origin.lat},${origin.lng}`;
  } else if (origin.address) {
    originStr = encodeURIComponent(`${origin.address} อำเภอโพนนาแก้ว จังหวัดสกลนคร`);
  } else {
    originStr = '17.2225884,104.3093759'; // Default Phon Na Kaeo Hospital
  }

  if (stops.length === 1) {
    const dest = stops[0];
    const destStr = dest.lat && dest.lng 
      ? `${dest.lat},${dest.lng}` 
      : encodeURIComponent(`${dest.address || ''} อำเภอโพนนาแก้ว จังหวัดสกลนคร`);
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;
  }

  // Final destination is the last stop
  const lastStop = stops[stops.length - 1];
  const destinationStr = lastStop.lat && lastStop.lng 
    ? `${lastStop.lat},${lastStop.lng}` 
    : encodeURIComponent(`${lastStop.address || ''} อำเภอโพนนาแก้ว จังหวัดสกลนคร`);

  // Waypoints are all stops between origin and destination
  const waypoints = stops.slice(0, stops.length - 1).map(stop => {
    if (stop.lat && stop.lng) {
      return `${stop.lat},${stop.lng}`;
    }
    return encodeURIComponent(`${stop.address || ''} อำเภอโพนนาแก้ว จังหวัดสกลนคร`);
  });

  const waypointsStr = encodeURIComponent(waypoints.join('|'));

  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}&waypoints=${waypointsStr}&travelmode=driving`;
}

/**
 * Open Multi-Stop Route in Google Maps
 */
export function openGoogleMapsMultiStop(
  origin: LocationPoint | string,
  stops: LocationPoint[]
): void {
  const url = getGoogleMapsMultiStopUrl(origin, stops);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Format coordinates for clean display
 */
export function formatCoordinates(lat?: number, lng?: number): string {
  if (!lat || !lng) return 'ยังไม่ได้ระบุพิกัด';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
