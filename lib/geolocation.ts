const OFFICE_LAT = -5.1597320842062295
const OFFICE_LON = 119.4099062887864
const RADIUS_METERS = 100 // 100 meter radius

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function isWithinRadius(userLat: number, userLon: number): boolean {
  const distance = calculateDistance(OFFICE_LAT, OFFICE_LON, userLat, userLon)
  return distance <= RADIUS_METERS
}

export function getOfficeCoordinates() {
  return { latitude: OFFICE_LAT, longitude: OFFICE_LON }
}

export function isLate(): boolean {
  const now = new Date()
  const checkInDeadline = new Date()
  checkInDeadline.setHours(7, 40, 0, 0)
  return now > checkInDeadline
}

export function isCheckOutTime(): boolean {
  const now = new Date()
  const checkOutTime = new Date()
  checkOutTime.setHours(16, 10, 0, 0)
  return now >= checkOutTime
}
