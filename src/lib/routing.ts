/**
 * Moteur de Routage "Ultra-Precision" (API Driven + Advanced Snap-to-Road)
 */

export const GPS: Record<string, [number, number]> = {
  'palais': [14.6681, -17.4420], 'independance': [14.6698, -17.4388], 'sandaga': [14.6720, -17.4359], 'petersen': [14.6728, -17.4326], 'kermel': [14.6650, -17.4410],
  'medina': [14.6837, -17.4507], 'fass': [14.6910, -17.4465], 'tilene': [14.6890, -17.4390], 'gueule-tapee': [14.6860, -17.4430],
  'colobane': [14.6930, -17.4440], 'hlm': [14.7011, -17.4438], 'castors': [14.7055, -17.4465], 'dieuppeul': [14.7035, -17.4570], 'autoroute-hann': [14.7050, -17.4320], 'cyrnos': [14.6850, -17.4300],
  'liberte6': [14.7147, -17.4585], 'sacrecoeur': [14.7088, -17.4518], 'grand-yoff': [14.7226, -17.4555], 'patte-oie': [14.7229, -17.4481],
  'ouakam': [14.7340, -17.4900], 'ngor': [14.7470, -17.5130], 'yoff': [14.7530, -17.4740], 'aeroport': [14.7425, -17.4902],
  'pikine': [14.7473, -17.3867], 'thiaroye-gare': [14.7298, -17.3740], 'parcelles': [14.7853, -17.4277],
  'rufisque': [14.7165, -17.2718], 'diamniadio': [14.7180, -17.1830],
}

const LOCATIONIQ_KEY = 'pk.ef8f3d80db02a286ae4b6fae736af632'

export type RoadGeometry = { coords: [number, number][], distances: number[], total: number }
export const roadCache = new Map<string, RoadGeometry>()

function getSafeFallback(coords: [number, number][]): [number, number][] {
  const result: [number, number][] = [coords[0]]
  for (let i = 0; i < coords.length - 1; i++) {
    const c1 = coords[i], c2 = coords[i+1]
    const isEast = (c: [number,number]) => c[1] > -17.41; const isWest = (c: [number,number]) => c[1] < -17.435
    if ((isEast(c1) && isWest(c2)) || (isWest(c1) && isEast(c2))) {
      result.push([14.7000, -17.4350], [14.6850, -17.4290])
    }
    result.push(c2)
  }
  return result
}

export async function getFullRoadPath(stopIds: string[]): Promise<RoadGeometry> {
  const key = stopIds.join('|'); if (roadCache.has(key)) return roadCache.get(key)!
  const stopsCoords = stopIds.map(id => GPS[id]).filter(Boolean)
  let finalCoords: [number, number][] = getSafeFallback(stopsCoords)
  if (stopsCoords.length >= 2) {
    try {
      const query = stopsCoords.map(c => `${c[1]},${c[0]}`).join(';')
      const url = `https://us1.locationiq.com/v1/directions/driving/${query}?key=${LOCATIONIQ_KEY}&overview=full&geometries=geojson`
      const res = await fetch(url); if (res.ok) {
        const data = await res.json()
        if (data.routes?.[0]) finalCoords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number])
      }
    } catch (e) { console.warn("LocationIQ Throttling - Using Fallback") }
  }
  const distances: number[] = [0]; let total = 0
  for (let i = 0; i < finalCoords.length - 1; i++) {
    const d = getDistanceKm(finalCoords[i][0], finalCoords[i][1], finalCoords[i+1][0], finalCoords[i+1][1])
    total += d; distances.push(total)
  }
  const result = { coords: finalCoords, distances, total }; roadCache.set(key, result); return result
}

export function getFullRoadPathSync(stopIds: string[]): RoadGeometry {
  const key = stopIds.join('|'); if (roadCache.has(key)) return roadCache.get(key)!
  const stopsCoords = stopIds.map(id => GPS[id]).filter(Boolean); const fallback = getSafeFallback(stopsCoords)
  const distances: number[] = [0]; let total = 0
  for (let i = 0; i < fallback.length - 1; i++) {
    const d = getDistanceKm(fallback[i][0], fallback[i][1], fallback[i+1][0], fallback[i+1][1])
    total += d; distances.push(total)
  }
  const result = { coords: fallback, distances, total }; getFullRoadPath(stopIds); return result
}

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; const dLat = (lat2-lat1)*(Math.PI/180); const dLon = (lon2-lon1)*(Math.PI/180)
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function interpolate(road: RoadGeometry, progress: number): [number, number] {
  if (road.coords.length < 2) return road.coords[0] || [0, 0]
  const target = (progress % 1) * road.total; let low = 0, high = road.distances.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (road.distances[mid] < target) low = mid + 1; else high = mid
  }
  const i = Math.max(1, low); const dStart = road.distances[i-1], dEnd = road.distances[i]
  const segProgress = dEnd === dStart ? 0 : (target - dStart) / (dEnd - dStart)
  const p1 = road.coords[i-1], p2 = road.coords[i]
  return [ p1[0] + (p2[0]-p1[0])*segProgress, p1[1] + (p2[1]-p1[1])*segProgress ]
}
