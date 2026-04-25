/**
 * SunuBus v5.0 — Application Mobile Passager
 * Architecture: Single Page App avec navigation bottom tabs
 * Modules: Carte · Itinéraire · Lignes · Recherche · Arrêt · Favoris
 */

import L from 'leaflet';
import { stops, lines, buses } from './data/network';
import { 
  findJourneys, getPredictions, getSearchResults, getServingLines,
  getStopBusyness, getJourneyIdeas, formatEta, calculateFare,
  tickBuses, getOccupancyLabel, hydrateNetworkData, hydrateSnapshot
} from './lib/transit';
import { getLineRoadGeometry, interpolate, cleanAllGeometries } from './lib/routing';
import { initPushNotifications } from './lib/push';
import type { Stop, Line } from './types';

// ── State ─────────────────────────────────────────────────────────────────────
let map: L.Map | null = null;

let selectedStop: Stop | null = null;
let selectedLine: Line | null = null;
let favorites: { stops: string[]; lines: string[] } = { stops: [], lines: [] };
let busMarkers: Map<string, L.Marker> = new Map();
let linePolylines: Map<string, L.Polyline> = new Map();
let userMarker: L.Marker | null = null;

let busRoads: Map<string, any> = new Map();

// ── Load favorites ────────────────────────────────────────────────────────────
function loadFavorites() {
  try {
    const saved = localStorage.getItem('sunubus_favorites_v5');
    if (saved) favorites = JSON.parse(saved);
  } catch {}
}
function saveFavorites() {
  localStorage.setItem('sunubus_favorites_v5', JSON.stringify(favorites));
}
function toggleFavoriteStop(id: string) {
  const idx = favorites.stops.indexOf(id);
  if (idx === -1) favorites.stops.push(id);
  else favorites.stops.splice(idx, 1);
  saveFavorites();
}
function toggleFavoriteLine(id: string) {
  const idx = favorites.lines.indexOf(id);
  if (idx === -1) favorites.lines.push(id);
  else favorites.lines.splice(idx, 1);
  saveFavorites();
}

// ── API Hydration ─────────────────────────────────────────────────────────────
async function fetchAndHydrate() {
  try {
    const res = await fetch('/api/network');
    if (res.ok) hydrateNetworkData(await res.json());
  } catch {}
}
async function fetchSnapshot() {
  try {
    const res = await fetch('/api/snapshot');
    if (res.ok) hydrateSnapshot(await res.json());
  } catch {}
}

// ── Map Init ──────────────────────────────────────────────────────────────────
function initMap() {
  if (map) { map.invalidateSize(); return; }
  const el = document.getElementById('map-canvas');
  if (!el) return;

  map = L.map('map-canvas', { zoomControl: false, attributionControl: false })
    .setView([14.72, -17.44], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, opacity: 0.85
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  // Draw all stops
  stops.forEach(stop => {
    if (!stop.coords) return;
    const icon = L.divIcon({
      className: '',
      html: `<div class="stop-dot" data-id="${stop.id}"></div>`,
      iconSize: [12, 12], iconAnchor: [6, 6]
    });
    L.marker(stop.coords as [number, number], { icon })
      .bindPopup(`<div class="popup-stop"><strong>${stop.name}</strong><br><span>${stop.district}</span><br><button onclick="window.showStop('${stop.id}')">Voir cet arrêt →</button></div>`)
      .addTo(map!);
  });

  // Draw all lines
  cleanAllGeometries();
  lines.forEach(line => {
    const road = getLineRoadGeometry(line.id, line.stopIds);
    busRoads.set(line.id, road);
    if (road.coords.length > 1) {
      const poly = L.polyline(road.coords as [number, number][], {
        color: line.color, weight: 3, opacity: 0.55
      }).addTo(map!);
      linePolylines.set(line.id, poly);
    }
  });

  // Init bus markers
  buses.forEach(bus => {
    const line = lines.find(l => l.id === bus.lineId);
    if (!line) return;
    const icon = L.divIcon({
      className: '',
      html: `<div class="bus-marker" style="background:${line.color}">${line.code}</div>`,
      iconSize: [28, 20], iconAnchor: [14, 10]
    });
    const marker = L.marker([14.72, -17.44], { icon }).addTo(map!);
    busMarkers.set(bus.id, marker);
  });

  startBusAnimation();

  // User location
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(pos => {
      const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      if (!userMarker) {
        const icon = L.divIcon({
          className: '',
          html: '<div class="user-dot"></div>',
          iconSize: [16, 16], iconAnchor: [8, 8]
        });
        userMarker = L.marker(ll, { icon }).addTo(map!);
      } else {
        userMarker.setLatLng(ll);
      }
    }, () => {}, { enableHighAccuracy: true });
  }
}

let _animFrame: number | null = null; void _animFrame;
function startBusAnimation() {
  function frame() {
    tickBuses();
    buses.forEach(bus => {
      const road = busRoads.get(bus.lineId);
      const marker = busMarkers.get(bus.id);
      if (!road || !marker) return;
      const pos = interpolate(road, bus.progress);
      marker.setLatLng(pos as [number, number]);
    });
    _animFrame = requestAnimationFrame(frame);
  }
  _animFrame = requestAnimationFrame(frame);
}

// ── Tab Navigation ────────────────────────────────────────────────────────────
(window as any).switchTab = function(tab: string) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const pane = document.getElementById(`tab-${tab}`);
  const navBtn = document.querySelector(`.nav-tab[data-tab="${tab}"]`);
  if (pane) pane.classList.add('active');
  if (navBtn) navBtn.classList.add('active');

  if (tab === 'carte') setTimeout(initMap, 100);
  if (tab === 'lignes') renderLines('');
  if (tab === 'favoris') renderFavorites();
};

// ── Stop Detail ───────────────────────────────────────────────────────────────
(window as any).showStop = function(stopId: string) {
  selectedStop = stops.find(s => s.id === stopId) || null;
  if (!selectedStop) return;
  renderStopDetail(selectedStop);
  (window as any).switchTab('stop-detail');
};

function renderStopDetail(stop: Stop) {
  const pane = document.getElementById('tab-stop-detail');
  if (!pane) return;
  const predictions = getPredictions(stop.id);
  const servingLines = getServingLines(stop.id);
  const journeyIdeas = getJourneyIdeas(stop.id);
  const busyness = getStopBusyness(stop.id);
  const isFav = favorites.stops.includes(stop.id);

  pane.innerHTML = `
    <div class="detail-header">
      <button class="btn-back" onclick="window.switchTab('carte')">←</button>
      <div class="detail-title">
        <h2>${stop.name}</h2>
        <span class="badge-district">${stop.district}</span>
      </div>
      <button class="btn-fav ${isFav ? 'active' : ''}" onclick="window.toggleFavStop('${stop.id}')">♥</button>
    </div>

    <div class="detail-card">
      <div class="busyness-row">
        <span class="busyness-label">Fréquentation</span>
        <span class="busyness-val ${busynessClass(busyness)}">${busyness}</span>
      </div>
      <div class="lines-serving">
        ${servingLines.map(l => `<span class="line-badge-sm" style="background:${l.color}">${l.code}</span>`).join('')}
      </div>
    </div>

    <h3 class="section-title">🕐 Prochains passages</h3>
    <div class="predictions-list">
      ${predictions.length === 0
        ? '<div class="empty-state">Aucun bus en approche</div>'
        : predictions.slice(0, 5).map(pred => `
          <div class="pred-card">
            <div class="pred-line" style="background:${pred.line.color}">${pred.line.code}</div>
            <div class="pred-info">
              <div class="pred-name">${pred.line.name}</div>
              <div class="pred-occ occ-${pred.bus.passengers/pred.bus.capacity > 0.8 ? 'high' : pred.bus.passengers/pred.bus.capacity > 0.45 ? 'mid' : 'low'}">
                ${getOccupancyLabel(pred.bus)}
              </div>
            </div>
            <div class="pred-eta">${formatEta(pred.etaMin)}</div>
          </div>
        `).join('')}
    </div>

    <h3 class="section-title">🚌 Lignes au départ</h3>
    <div class="journey-ideas">
      ${journeyIdeas.slice(0, 4).map(j => `
        <div class="journey-idea-card" onclick="window.planFrom('${stop.id}', '${j.line.stopIds.at(-1)}')">
          <span class="line-badge-sm" style="background:${j.line.color}">${j.line.code}</span>
          <span class="ji-dest">→ ${j.terminus}</span>
          <span class="ji-dur">${j.durationMin} min</span>
        </div>
      `).join('')}
    </div>
  `;
}

function busynessClass(b: string) {
  if (b.includes('Tres')) return 'busy-high';
  if (b.includes('Bon')) return 'busy-mid';
  return 'busy-low';
}

(window as any).toggleFavStop = function(id: string) {
  toggleFavoriteStop(id);
  if (selectedStop) renderStopDetail(selectedStop);
  renderFavorites();
};

// ── Journey Planner ───────────────────────────────────────────────────────────
(window as any).planFrom = function(fromId: string, toId: string) {
  const fromInput = document.getElementById('input-from') as HTMLInputElement;
  const toInput = document.getElementById('input-to') as HTMLInputElement;
  const fromStop = stops.find(s => s.id === fromId);
  const toStop = stops.find(s => s.id === toId);
  if (fromInput && fromStop) fromInput.value = fromStop.name;
  if (toInput && toStop) toInput.value = toStop.name;
  (window as any).switchTab('trajet');
  setTimeout(() => (window as any).searchRoute(), 200);
};

(window as any).searchRoute = function() {
  const fromVal = (document.getElementById('input-from') as HTMLInputElement)?.value || '';
  const toVal = (document.getElementById('input-to') as HTMLInputElement)?.value || '';
  const resultsEl = document.getElementById('route-results');
  if (!resultsEl) return;

  if (!toVal) {
    resultsEl.innerHTML = '<div class="empty-state">Saisissez une destination</div>';
    return;
  }

  // Find matching stops
  const fromStop = fromVal === 'Position actuelle'
    ? stops[0]
    : stops.find(s => s.name.toLowerCase().includes(fromVal.toLowerCase())) || stops[0];
  const toStop = stops.find(s => s.name.toLowerCase().includes(toVal.toLowerCase()));

  if (!toStop) {
    resultsEl.innerHTML = '<div class="empty-state">Destination introuvable. Essayez un arrêt connu.</div>';
    return;
  }

  resultsEl.innerHTML = '<div class="loading-spin">Calcul en cours...</div>';

  setTimeout(() => {
    const journeys = findJourneys(fromStop.id, toStop.id);
    if (journeys.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state">Aucun itinéraire trouvé pour ce trajet.</div>';
      return;
    }
    resultsEl.innerHTML = journeys.slice(0, 5).map((j, i) => `
      <div class="journey-card ${i === 0 ? 'best' : ''}">
        ${i === 0 ? '<div class="best-badge">⭐ Recommandé</div>' : ''}
        <div class="journey-header">
          <span class="journey-dur">🕐 ${j.totalDurationMin} min</span>
          <span class="journey-fare">💰 ${calculateFare(j.totalDurationMin * 300)} FCFA</span>
        </div>
        <div class="journey-segments">
          ${j.segments.map(seg => `
            <div class="segment seg-${seg.kind}">
              ${seg.kind === 'walk' ? `🚶 Marche (${seg.durationMin} min)` : ''}
              ${seg.kind !== 'walk' && seg.line ? `
                <span class="line-badge-sm" style="background:${seg.line.color}">${seg.line.code}</span>
                <span class="seg-info">${seg.fromStop.name} → ${seg.toStop.name}</span>
                <span class="seg-dur">${seg.durationMin} min</span>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <button class="btn-start-nav" onclick="window.startNav('${fromStop.name}', '${toStop.name}')">
          🧭 Démarrer
        </button>
      </div>
    `).join('');
  }, 400);
};

(window as any).startNav = function(from: string, to: string) {
  alert(`Navigation démarrée\nDe : ${from}\nVers : ${to}\n\nSuivez les indications sur la carte.`);
  (window as any).switchTab('carte');
};

// ── Lines Tab ─────────────────────────────────────────────────────────────────
let linesFilter: 'Tous' | 'DDD' | 'AFTU-TATA' = 'Tous';

function renderLines(search: string) {
  const container = document.getElementById('lines-container');
  if (!container) return;
  let filtered = lines;
  if (linesFilter !== 'Tous') filtered = filtered.filter(l => l.operatorId === linesFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(l =>
      l.code.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.headsign.toLowerCase().includes(q)
    );
  }
  container.innerHTML = filtered.length === 0
    ? '<div class="empty-state">Aucune ligne trouvée</div>'
    : filtered.map(line => {
        const isFav = favorites.lines.includes(line.id);
        const count = line.stopIds.length;
        return `
        <div class="line-card" onclick="window.showLine('${line.id}')">
          <div class="line-badge-lg" style="background:${line.color}">${line.code}</div>
          <div class="line-info">
            <div class="line-name">${line.name}</div>
            <div class="line-meta">${count} arrêts · ${line.frequencyMin} min · ${line.operatorId}</div>
          </div>
          <button class="btn-fav-sm ${isFav ? 'active' : ''}" onclick="event.stopPropagation();window.toggleFavLine('${line.id}')">♥</button>
        </div>`;
      }).join('');
}

(window as any).setLinesFilter = function(f: string) {
  linesFilter = f as any;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.filter-btn[data-f="${f}"]`)?.classList.add('active');
  const search = (document.getElementById('lines-search') as HTMLInputElement)?.value || '';
  renderLines(search);
};

(window as any).showLine = function(lineId: string) {
  selectedLine = lines.find(l => l.id === lineId) || null;
  if (!selectedLine) return;
  renderLineDetail(selectedLine);
  (window as any).switchTab('line-detail');
};

function renderLineDetail(line: Line) {
  const pane = document.getElementById('tab-line-detail');
  if (!pane) return;
  const isFav = favorites.lines.includes(line.id);
  const stopsOnLine = line.stopIds.map(id => stops.find(s => s.id === id)).filter(Boolean) as Stop[];
  const busesonLine = buses.filter(b => b.lineId === line.id);

  pane.innerHTML = `
    <div class="detail-header">
      <button class="btn-back" onclick="window.switchTab('lignes')">←</button>
      <div class="detail-title">
        <div class="line-badge-lg" style="background:${line.color}">${line.code}</div>
        <h2>${line.name}</h2>
      </div>
      <button class="btn-fav ${isFav ? 'active' : ''}" onclick="window.toggleFavLine('${line.id}')">♥</button>
    </div>

    <div class="detail-card">
      <div class="stat-row">
        <div class="stat-item"><span class="stat-n">${stopsOnLine.length}</span><span class="stat-l">Arrêts</span></div>
        <div class="stat-item"><span class="stat-n">${line.frequencyMin}mn</span><span class="stat-l">Fréquence</span></div>
        <div class="stat-item"><span class="stat-n">${line.baseMinutes}mn</span><span class="stat-l">Durée totale</span></div>
        <div class="stat-item"><span class="stat-n">${busesonLine.length}</span><span class="stat-l">Bus actifs</span></div>
      </div>
    </div>

    <h3 class="section-title">📍 Terminus → ${line.headsign}</h3>
    <div class="stops-timeline">
      ${stopsOnLine.map((stop, i) => `
        <div class="timeline-stop ${i === 0 ? 'first' : i === stopsOnLine.length - 1 ? 'last' : ''}"
             onclick="window.showStop('${stop.id}')">
          <div class="timeline-dot" style="border-color:${line.color}"></div>
          <div class="timeline-name">${stop.name}</div>
          <div class="timeline-district">${stop.district}</div>
        </div>
      `).join('')}
    </div>
  `;
}

(window as any).toggleFavLine = function(id: string) {
  toggleFavoriteLine(id);
  if (selectedLine && selectedLine.id === id) renderLineDetail(selectedLine);
  renderLines((document.getElementById('lines-search') as HTMLInputElement)?.value || '');
  renderFavorites();
};

// ── Search Tab ────────────────────────────────────────────────────────────────
(window as any).doSearch = function(query: string) {
  const container = document.getElementById('search-results-container');
  if (!container) return;
  if (!query.trim()) { container.innerHTML = ''; return; }
  const results = getSearchResults(query);
  container.innerHTML = results.length === 0
    ? '<div class="empty-state">Aucun résultat</div>'
    : results.map(r => {
        if (r.type === 'stop') return `
          <div class="search-result-card" onclick="window.showStop('${r.stop.id}')">
            <span class="result-icon">🚏</span>
            <div class="result-info">
              <div class="result-name">${r.stop.name}</div>
              <div class="result-sub">${r.stop.district}</div>
            </div>
          </div>`;
        if (r.type === 'line') return `
          <div class="search-result-card" onclick="window.showLine('${r.line.id}')">
            <span class="line-badge-sm" style="background:${r.line.color}">${r.line.code}</span>
            <div class="result-info">
              <div class="result-name">${r.line.name}</div>
              <div class="result-sub">${r.line.headsign}</div>
            </div>
          </div>`;
        return `
          <div class="search-result-card">
            <span class="result-icon">${r.icon}</span>
            <div class="result-info">
              <div class="result-name">${r.label}</div>
              <div class="result-sub">${r.subLabel}</div>
            </div>
          </div>`;
      }).join('');
};

// ── Favorites Tab ─────────────────────────────────────────────────────────────
function renderFavorites() {
  const pane = document.getElementById('tab-favoris');
  if (!pane) return;
  const favStops = stops.filter(s => favorites.stops.includes(s.id));
  const favLines = lines.filter(l => favorites.lines.includes(l.id));

  pane.innerHTML = `
    <div class="tab-header"><h2>⭐ Mes Favoris</h2></div>
    ${favStops.length === 0 && favLines.length === 0
      ? '<div class="empty-state" style="margin-top:3rem">Aucun favori. Ajoutez des arrêts et lignes en cliquant sur ♥</div>'
      : ''}
    ${favStops.length > 0 ? `
      <h3 class="section-title">🚏 Arrêts favoris</h3>
      ${favStops.map(s => `
        <div class="line-card" onclick="window.showStop('${s.id}')">
          <span class="result-icon">🚏</span>
          <div class="line-info"><div class="line-name">${s.name}</div><div class="line-meta">${s.district}</div></div>
          <button class="btn-fav-sm active" onclick="event.stopPropagation();window.toggleFavStop('${s.id}')">♥</button>
        </div>`).join('')}
    ` : ''}
    ${favLines.length > 0 ? `
      <h3 class="section-title">🚌 Lignes favorites</h3>
      ${favLines.map(l => `
        <div class="line-card" onclick="window.showLine('${l.id}')">
          <div class="line-badge-lg" style="background:${l.color}">${l.code}</div>
          <div class="line-info"><div class="line-name">${l.name}</div><div class="line-meta">${l.stopIds.length} arrêts · ${l.frequencyMin} min</div></div>
          <button class="btn-fav-sm active" onclick="event.stopPropagation();window.toggleFavLine('${l.id}')">♥</button>
        </div>`).join('')}
    ` : ''}
  `;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadFavorites();
  await fetchAndHydrate();
  (window as any).switchTab('carte');
  setInterval(fetchSnapshot, 5000);
  initPushNotifications();

  // Search input
  document.getElementById('lines-search')?.addEventListener('input', e => {
    renderLines((e.target as HTMLInputElement).value);
  });
  document.getElementById('search-input')?.addEventListener('input', e => {
    (window as any).doSearch((e.target as HTMLInputElement).value);
  });
});
