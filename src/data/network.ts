import type { Bus, Line, Stop } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// BASE DE DONNÉES DAKAR DEM DIKK (DDD) - v5.1
// ─────────────────────────────────────────────────────────────────────────────

export const stops: Stop[] = [
  // CENTRE VILLE / PLATEAU
  { id: 'leclerc', name: 'Place Leclerc', x: 20, y: 75, district: 'Plateau', coords: [14.6683, -17.4339] },
  { id: 'palais1', name: 'Palais de Justice 1', x: 22, y: 78, district: 'Plateau', coords: [14.665, -17.432] },
  { id: 'palais2', name: 'Palais de Justice 2', x: 23, y: 78, district: 'Plateau', coords: [14.664, -17.433] },
  { id: 'independance', name: 'Place Indépendance', x: 21, y: 72, district: 'Plateau', coords: [14.669, -17.436] },
  { id: 'lat-dior', name: 'Gare Lat Dior', x: 24, y: 68, district: 'Plateau', coords: [14.675, -17.438] },
  { id: 'sandaga', name: 'Marché Sandaga', x: 25, y: 70, district: 'Plateau', coords: [14.672, -17.438] },
  { id: 'castors', name: 'Station Castors', x: 40, y: 55, district: 'Castors', coords: [14.71, -17.43] },
  
  // RÉSIDENTIEL / UNIVERSITÉ
  { id: 'ouakam', name: 'Terminus Ouakam', x: 15, y: 35, district: 'Ouakam', coords: [14.721, -17.488] },
  { id: 'mamelles', name: 'Les Mamelles', x: 12, y: 40, district: 'Ouakam', coords: [14.72, -17.49] },
  { id: 'almadies', name: 'Almadies', x: 10, y: 25, district: 'Almadies', coords: [14.75, -17.51] },
  { id: 'ngor', name: 'Ngor', x: 15, y: 15, district: 'Ngor', coords: [14.75, -17.49] },
  { id: 'ucad', name: 'Université UCAD', x: 25, y: 55, district: 'Fann', coords: [14.69, -17.46] },
  { id: 'fann', name: 'Hôpital Fann', x: 24, y: 58, district: 'Fann', coords: [14.688, -17.465] },
  { id: 'aeroport', name: 'Aéroport LSS', x: 15, y: 10, district: 'Ngor', coords: [14.74, -17.48] },
  
  // LIBERTÉ / DIEUPPEUL
  { id: 'dieuppeul', name: 'Terminus Dieuppeul', x: 35, y: 50, district: 'Dieuppeul', coords: [14.71, -17.45] },
  { id: 'liberte5', name: 'Liberté 5', x: 40, y: 45, district: 'Sicap', coords: [14.715, -17.445] },
  { id: 'liberte6', name: 'Terminus Liberté 6', x: 45, y: 40, district: 'Sicap', coords: [14.72, -17.44] },
  { id: 'jet-eau', name: 'Rond-point Jet d\'Eau', x: 38, y: 55, district: 'Sicap', coords: [14.705, -17.442] },
  
  // PARCELLES / BANLIEUE NORD
  { id: 'parcelles', name: 'Terminus Parcelles', x: 55, y: 20, district: 'Parcelles', coords: [14.76, -17.44] },
  { id: 'dior', name: 'Dior Centre', x: 58, y: 22, district: 'Parcelles', coords: [14.755, -17.435] },
  { id: 'scat_urbam', name: 'Terminus Scat Urbam', x: 62, y: 30, district: 'Grand Yoff', coords: [14.74, -17.43] },
  { id: 'patte_oie', name: 'Patte d\'Oie', x: 65, y: 45, district: 'Dakar', coords: [14.73, -17.42] },
  { id: 'stade_lss', name: 'Stade LSS', x: 68, y: 40, district: 'Dakar', coords: [14.74, -17.41] },
  { id: 'cambarene2', name: 'Cambérène 2', x: 60, y: 15, district: 'Cambérène', coords: [14.76, -17.41] },
  
  // GUÉDIAWAYE / PIKINE
  { id: 'guediawaye', name: 'Terminus Guédiawaye', x: 75, y: 25, district: 'Guédiawaye', coords: [14.78, -17.39] },
  { id: 'daroukhane', name: 'Terminus Daroukhane', x: 78, y: 30, district: 'Guédiawaye', coords: [14.79, -17.38] },
  { id: 'pikine', name: 'Gare Pikine', x: 72, y: 55, district: 'Pikine', coords: [14.75, -17.40] },
  { id: 'thiaroye', name: 'Dépôt Thiaroye', x: 80, y: 60, district: 'Thiaroye', coords: [14.74, -17.37] },
  { id: 'baux_maraichers', name: 'Baux Maraîchers', x: 68, y: 58, district: 'Pikine', coords: [14.73, -17.40] },
  { id: 'gadaye', name: 'Cité Gadaye', x: 72, y: 28, district: 'Guédiawaye', coords: [14.78, -17.37] },
  
  // RUFISQUE / EST
  { id: 'keurmassar', name: 'Terminus Keur Massar', x: 88, y: 60, district: 'Keur Massar', coords: [14.78, -17.30] },
  { id: 'malika', name: 'Terminus Malika', x: 92, y: 50, district: 'Malika', coords: [14.80, -17.33] },
  { id: 'rufisque', name: 'Terminus Rufisque', x: 95, y: 70, district: 'Rufisque', coords: [14.71, -17.27] },
  { id: 'bargny', name: 'Bargny', x: 98, y: 75, district: 'Bargny', coords: [14.70, -17.23] },
  { id: 'diamniadio', name: 'Diamniadio', x: 105, y: 80, district: 'Diamniadio', coords: [14.70, -17.15] },
  { id: 'jaxaay', name: 'Jaxaay', x: 90, y: 65, district: 'Banlieue', coords: [14.75, -17.28] },
  { id: 'bayakh', name: 'Terminus Bayakh', x: 110, y: 60, district: 'Banlieue', coords: [14.79, -17.20] },
  { id: 'yenne', name: 'Yenne', x: 100, y: 90, district: 'Banlieue', coords: [14.65, -17.15] },
  { id: 'sangalkam', name: 'Sangalkam', x: 92, y: 68, district: 'Banlieue', coords: [14.75, -17.23] },
];

export const lines: Line[] = [
  // --- LIGNES URBAINES ---
  { id: 'ddd-1', operatorId: 'DDD', code: '1', name: 'Parcelles ↔ Leclerc', color: '#004a99', headsign: 'Place Leclerc', baseMinutes: 45, frequencyMin: 15, stopIds: ['parcelles', 'dior', 'stade_lss', 'patte_oie', 'ucad', 'sandaga', 'independance', 'leclerc'] },
  { id: 'ddd-4', operatorId: 'DDD', code: '4', name: 'Liberté 5 ↔ Leclerc', color: '#004a99', headsign: 'Leclerc', baseMinutes: 40, frequencyMin: 15, stopIds: ['liberte5', 'dieuppeul', 'jet-eau', 'ucad', 'sandaga', 'leclerc'] },
  { id: 'ddd-7', operatorId: 'DDD', code: '7', name: 'Ouakam ↔ Palais 2', color: '#004a99', headsign: 'Palais de Justice', baseMinutes: 35, frequencyMin: 15, stopIds: ['ouakam', 'mamelles', 'ucad', 'sandaga', 'palais2'] },
  { id: 'ddd-8', operatorId: 'DDD', code: '8', name: 'Aéroport LSS ↔ Palais 2', color: '#004a99', headsign: 'Palais 2', baseMinutes: 50, frequencyMin: 15, stopIds: ['aeroport', 'ngor', 'stade_lss', 'ucad', 'palais2'] },
  { id: 'ddd-9', operatorId: 'DDD', code: '9', name: 'Liberté 6 ↔ Palais 2', color: '#004a99', headsign: 'Palais 2', baseMinutes: 40, frequencyMin: 15, stopIds: ['liberte6', 'dieuppeul', 'jet-eau', 'palais2'] },
  { id: 'ddd-10', operatorId: 'DDD', code: '10', name: 'Liberté 5 ↔ Palais 2', color: '#004a99', headsign: 'Palais 2', baseMinutes: 40, frequencyMin: 15, stopIds: ['liberte5', 'dieuppeul', 'ucad', 'palais2'] },
  { id: 'ddd-13', operatorId: 'DDD', code: '13', name: 'Liberté 5 ↔ Palais 2', color: '#004a99', headsign: 'Palais 2', baseMinutes: 40, frequencyMin: 15, stopIds: ['liberte5', 'castors', 'palais2'] },
  { id: 'ddd-18', operatorId: 'DDD', code: '18', name: 'Dieuppeul ↔ Centre', color: '#2e7d32', headsign: 'Boucle Centre', baseMinutes: 55, frequencyMin: 15, stopIds: ['dieuppeul', 'pikine', 'leclerc', 'sandaga', 'dieuppeul'] },
  { id: 'ddd-20', operatorId: 'DDD', code: '20', name: 'Dieuppeul ↔ Boucle', color: '#2e7d32', headsign: 'Boucle Dakar', baseMinutes: 55, frequencyMin: 15, stopIds: ['dieuppeul', 'ucad', 'leclerc', 'dieuppeul'] },
  { id: 'ddd-23', operatorId: 'DDD', code: '23', name: 'Parcelles ↔ Palais 1', color: '#004a99', headsign: 'Palais 1', baseMinutes: 60, frequencyMin: 15, stopIds: ['parcelles', 'stade_lss', 'ucad', 'palais1'] },
  { id: 'ddd-121', operatorId: 'DDD', code: '121', name: 'Scat Urbam ↔ Leclerc', color: '#004a99', headsign: 'Leclerc', baseMinutes: 40, frequencyMin: 15, stopIds: ['scat_urbam', 'liberte6', 'ucad', 'leclerc'] },

  // --- LIGNES BANLIEUE ---
  { id: 'ddd-2', operatorId: 'DDD', code: '2', name: 'Daroukhane ↔ Leclerc', color: '#c5a059', headsign: 'Place Leclerc', baseMinutes: 55, frequencyMin: 15, stopIds: ['daroukhane', 'guediawaye', 'pikine', 'leclerc'] },
  { id: 'ddd-5', operatorId: 'DDD', code: '5', name: 'Guédiawaye ↔ Palais 1', color: '#c5a059', headsign: 'Palais 1', baseMinutes: 50, frequencyMin: 15, stopIds: ['guediawaye', 'patte_oie', 'palais1'] },
  { id: 'ddd-6', operatorId: 'DDD', code: '6', name: 'Cambérène 2 ↔ Palais 2', color: '#c5a059', headsign: 'Palais 2', baseMinutes: 50, frequencyMin: 15, stopIds: ['cambarene2', 'parcelles', 'stade_lss', 'palais2'] },
  { id: 'ddd-11', operatorId: 'DDD', code: '11', name: 'Keur Massar ↔ Lat Dior', color: '#c5a059', headsign: 'Lat Dior', baseMinutes: 75, frequencyMin: 15, stopIds: ['keurmassar', 'thiaroye', 'pikine', 'lat-dior'] },
  { id: 'ddd-12', operatorId: 'DDD', code: '12', name: 'Guédiawaye ↔ Palais 1', color: '#c5a059', headsign: 'Palais 1', baseMinutes: 55, frequencyMin: 15, stopIds: ['guediawaye', 'thiaroye', 'palais1'] },
  { id: 'ddd-15', operatorId: 'DDD', code: '15', name: 'Rufisque ↔ Palais 1', color: '#c5a059', headsign: 'Palais 1', baseMinutes: 90, frequencyMin: 15, stopIds: ['rufisque', 'thiaroye', 'palais1'] },
  { id: 'ddd-16a', operatorId: 'DDD', code: '16A', name: 'Malika ↔ Palais 1', color: '#c5a059', headsign: 'Palais 1', baseMinutes: 80, frequencyMin: 15, stopIds: ['malika', 'keurmassar', 'palais1'] },
  { id: 'ddd-208', operatorId: 'DDD', code: '208', name: 'Bayakh ↔ Rufisque', color: '#c5a059', headsign: 'Rufisque', baseMinutes: 45, frequencyMin: 15, stopIds: ['bayakh', 'sangalkam', 'rufisque'] },
  { id: 'ddd-213', operatorId: 'DDD', code: '213', name: 'Rufisque ↔ Dieuppeul', color: '#c5a059', headsign: 'Dieuppeul', baseMinutes: 80, frequencyMin: 15, stopIds: ['rufisque', 'jaxaay', 'dieuppeul'] },
  { id: 'ddd-217', operatorId: 'DDD', code: '217', name: 'Thiaroye ↔ Ouakam', color: '#c5a059', headsign: 'Ouakam', baseMinutes: 70, frequencyMin: 15, stopIds: ['thiaroye', 'parcelles', 'ngor', 'ouakam'] },
  { id: 'ddd-218', operatorId: 'DDD', code: '218', name: 'Thiaroye ↔ Aéroport', color: '#c5a059', headsign: 'Aéroport', baseMinutes: 70, frequencyMin: 15, stopIds: ['thiaroye', 'patte_oie', 'aeroport'] },
  { id: 'ddd-219', operatorId: 'DDD', code: '219', name: 'Daroukhane ↔ Ouakam', color: '#c5a059', headsign: 'Ouakam', baseMinutes: 75, frequencyMin: 15, stopIds: ['daroukhane', 'guediawaye', 'liberte6', 'ouakam'] },
  { id: 'ddd-220', operatorId: 'DDD', code: '220', name: 'Rufisque ↔ Gédiawaye', color: '#c5a059', headsign: 'Guédiawaye', baseMinutes: 80, frequencyMin: 15, stopIds: ['rufisque', 'jaxaay', 'keurmassar', 'guediawaye'] },
  { id: 'ddd-221', operatorId: 'DDD', code: '221', name: 'Gadaye ↔ Almadies', color: '#c5a059', headsign: 'Almadies', baseMinutes: 65, frequencyMin: 15, stopIds: ['gadaye', 'patte_oie', 'almadies'] },
  { id: 'ddd-227', operatorId: 'DDD', code: '227', name: 'Keur Massar ↔ Parcelles', color: '#c5a059', headsign: 'Parcelles', baseMinutes: 60, frequencyMin: 15, stopIds: ['keurmassar', 'malika', 'guediawaye', 'parcelles'] },
  { id: 'ddd-228', operatorId: 'DDD', code: '228', name: 'Rufisque ↔ Yenne', color: '#c5a059', headsign: 'Yenne', baseMinutes: 45, frequencyMin: 15, stopIds: ['rufisque', 'bargny', 'diamniadio', 'yenne'] },
  { id: 'ddd-232', operatorId: 'DDD', code: '232', name: 'Baux Maraichers ↔ LSS', color: '#c5a059', headsign: 'Aéroport', baseMinutes: 45, frequencyMin: 15, stopIds: ['baux_maraichers', 'thiaroye', 'aeroport'] },
  { id: 'ddd-233', operatorId: 'DDD', code: '233', name: 'Baux Maraichers ↔ Palais 1', color: '#c5a059', headsign: 'Palais 1', baseMinutes: 50, frequencyMin: 15, stopIds: ['baux_maraichers', 'ucad', 'palais1'] },
  { id: 'ddd-234', operatorId: 'DDD', code: '234', name: 'Jaxaay ↔ Leclerc', color: '#c5a059', headsign: 'Leclerc', baseMinutes: 80, frequencyMin: 15, stopIds: ['jaxaay', 'keurmassar', 'leclerc'] },
];

export const buses: Bus[] = lines.map((l, i) => ({
  id: `bus-${l.id}`,
  lineId: l.id,
  plate: `DK-${1000 + i}-AA`,
  progress: Math.random(),
  speedFactor: 0.8 + Math.random() * 0.4,
  passengers: Math.floor(Math.random() * 60),
  capacity: 80,
  nextStopId: l.stopIds[1]
}));
