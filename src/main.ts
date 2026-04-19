import { buses, lines, stops } from './data/network'
import { getPredictions, getSearchResults, tickBuses, formatEta, escapeHtml } from './lib/transit'
import './style.css'

declare const L: any

// ── State ──────────────────────────────────────────────────────────────────
type Tab = 'map' | 'search' | 'lines' | 'profile'
let activeTab: Tab = 'map'
let searchQuery = ''
let selectedStopId: string | null = null
let trackedBusId: string | null = null
let notifiedStops: string[] = []
let favorites: { type: 'line' | 'stop'; id: string }[] = []
let searchHistory: string[] = ['Pikine', 'Grand Yoff', 'Colobane', 'Sandaga']
let lineFilter: 'all' | 'DDD' | 'AFTU-TATA' = 'all'
let mapOperatorFilter: 'all' | 'DDD' | 'AFTU-TATA' = 'all'
let showIncident = false
let leafletMap: any = null
let canvasRenderer: any = null
let busCircles: Map<string, any> = new Map()

// ── Coordonnées GPS réelles de tous les arrêts ─────────────────────────────
const GPS: Record<string, [number, number]> = {
  // Plateau
  'palais':           [14.6681, -17.4420],
  'independance':     [14.6698, -17.4388],
  'sandaga':          [14.6720, -17.4359],
  'petersen':         [14.6728, -17.4326],
  'kermel':           [14.6650, -17.4410],
  'rebeuss':          [14.6590, -17.4352],
  'republique':       [14.6690, -17.4401],
  'dakar-ponty':      [14.6740, -17.4430],
  // Médina
  'medina':           [14.6837, -17.4507],
  'fass':             [14.6910, -17.4465],
  'tilene':           [14.6890, -17.4390],
  'biscuiterie':      [14.6970, -17.4380],
  'gueule-tapee':     [14.6860, -17.4430],
  // Colobane / HLM
  'colobane':         [14.6930, -17.4440],
  'hlm':              [14.7011, -17.4438],
  'castors':          [14.7055, -17.4465],
  'dieuppeul':        [14.7035, -17.4570],
  // VDN / SICAP
  'liberte6':         [14.7147, -17.4585],
  'sacrecoeur':       [14.7088, -17.4518],
  'grand-yoff':       [14.7226, -17.4555],
  'patte-oie':        [14.7229, -17.4481],
  'foire':            [14.7560, -17.4430],
  'nord-foire':       [14.7565, -17.4380],
  // Corniche / Almadies
  'fann':             [14.6877, -17.4635],
  'point-e':          [14.6980, -17.4590],
  'stele-mermoz':     [14.7175, -17.4730],
  'mermoz':           [14.7120, -17.4720],
  'virage':           [14.7200, -17.4720],
  'cite-etudiants':   [14.7050, -17.4600],
  'ouakam':           [14.7340, -17.4900],
  'almadies':         [14.7460, -17.5220],
  'ngor':             [14.7470, -17.5130],
  'yoff':             [14.7530, -17.4740],
  'aeroport':         [14.7425, -17.4902],
  // Pikine / Thiaroye
  'pikine':           [14.7473, -17.3867],
  'bounkheling':      [14.7450, -17.3820],
  'golf-sud':         [14.7390, -17.4220],
  'camp-penal':       [14.7296, -17.4100],
  'wakam':            [14.7200, -17.3950],
  'diamaguene':       [14.7520, -17.3800],
  'cite-sotrac':      [14.7450, -17.3950],
  'thiaroye-azur':    [14.7342, -17.3700],
  'thiaroye-gare':    [14.7298, -17.3740],
  // Banlieue nord
  'parcelles':        [14.7853, -17.4277],
  'cambrene':         [14.7912, -17.4232],
  'guediawaye':       [14.7783, -17.4020],
  'hamo4':            [14.7630, -17.4050],
  'cite-comico':      [14.7700, -17.4150],
  'sipres':           [14.7680, -17.3880],
  'dakar-eaux-forets':[14.7500, -17.4100],
  // Banlieue est
  'yeumbeul':         [14.7622, -17.3527],
  'malika':           [14.7756, -17.3176],
  'mbao':             [14.7191, -17.3480],
  'keur-mbaye-fall':  [14.7170, -17.3440],
  'keur-massar':      [14.7090, -17.3364],
  'zac-mbao':         [14.7200, -17.3400],
  'route-nationale':  [14.7400, -17.3600],
  // Périphérie
  'rufisque':         [14.7165, -17.2718],
  'bargny':           [14.7050, -17.2280],
  'diamniadio':       [14.7180, -17.1830],
  'sebikotane':       [14.7280, -17.1320],
}

// ── 12 corridors principaux (polylignes de fond) ──────────────────────────
const CORRIDORS = [
  ['palais','sandaga','petersen','medina','gueule-tapee','colobane','pikine','thiaroye-gare','rufisque','bargny','diamniadio','sebikotane'],
  ['palais','dakar-ponty','tilene','biscuiterie','hlm','dieuppeul','castors','liberte6','sacrecoeur','grand-yoff','patte-oie','nord-foire','parcelles','cambrene','guediawaye'],
  ['palais','fann','stele-mermoz','mermoz','ouakam','almadies','ngor','yoff'],
  ['fann','point-e','virage','cite-etudiants','liberte6','grand-yoff'],
  ['pikine','cite-sotrac','guediawaye','hamo4','sipres','cambrene'],
  ['pikine','bounkheling','diamaguene','thiaroye-azur','route-nationale','yeumbeul','malika'],
  ['pikine','zac-mbao','mbao','keur-mbaye-fall','keur-massar'],
  ['ouakam','aeroport','yoff'],
  ['parcelles','nord-foire','foire','patte-oie','golf-sud','camp-penal','pikine'],
  ['guediawaye','sipres','hamo4','dakar-eaux-forets','pikine'],
  ['medina','fass','colobane','biscuiterie','hlm','castors'],
  ['thiaroye-gare','mbao','rufisque','bargny','diamniadio'],
]

// ── Persistent DOM structure ───────────────────────────────────────────────
const appEl = document.querySelector<HTMLDivElement>('#app')!
const mapLayer = document.createElement('div')
mapLayer.id = 'map-layer'
mapLayer.style.cssText = 'position:absolute;inset:0;z-index:0;'
appEl.appendChild(mapLayer)

const uiLayer = document.createElement('div')
uiLayer.id = 'ui-layer'
uiLayer.style.cssText = 'position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;'
appEl.appendChild(uiLayer)

// ── Leaflet Map ────────────────────────────────────────────────────────────
function initMap() {
  if (leafletMap) { leafletMap.invalidateSize(); return }
  if (typeof L === 'undefined') return

  canvasRenderer = L.canvas({ padding: 0.5 })

  leafletMap = L.map('map-layer', { zoomControl: false, minZoom: 11, maxZoom: 18 })
    .setView([14.7137, -17.4300], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(leafletMap)

  // User location dot
  const userIcon = L.divIcon({ className: '', html: '<div class="user-dot-marker"></div>', iconSize: [20,20], iconAnchor: [10,10] })
  L.marker([14.7137, -17.4300], { icon: userIcon, zIndexOffset: 2000 }).addTo(leafletMap)

  // 12 corridors en fond (gris translucide)
  CORRIDORS.forEach(corridor => {
    const coords = corridor.map(id => GPS[id]).filter(Boolean)
    if (coords.length >= 2) L.polyline(coords, { color: '#9ca3af', weight: 2, opacity: 0.4 }).addTo(leafletMap)
  })

  // Stop markers (petits points)
  stops.forEach(stop => {
    const coords = GPS[stop.id]
    if (!coords) return
    const icon = L.divIcon({ className: '', html: '<div class="stop-marker"></div>', iconSize: [9,9], iconAnchor:[4.5,4.5] })
    L.marker(coords, { icon, zIndexOffset: 500 })
      .on('click', () => { selectedStopId = stop.id; trackedBusId = null; render() })
      .addTo(leafletMap)
  })
}

// ── Bus markers (Canvas circleMarker pour performance) ───────────────────
function updateBusMarkers() {
  if (!leafletMap || typeof L === 'undefined') return

  buses.forEach(bus => {
    const line = lines.find(l => l.id === bus.lineId)
    if (!line) return
    if (mapOperatorFilter !== 'all' && line.operatorId !== mapOperatorFilter) {
      // Cacher si filtre actif
      const existing = busCircles.get(bus.id)
      if (existing) { existing.setStyle({ opacity: 0, fillOpacity: 0 }) }
      return
    }

    const coords = line.stopIds.map(id => GPS[id]).filter(Boolean) as [number,number][]
    if (coords.length < 2) return

    const totalSegs = coords.length - 1
    const scaled = bus.progress * totalSegs
    const seg = Math.min(Math.floor(scaled), totalSegs - 1)
    const t = scaled - seg
    const from = coords[seg]
    const to = coords[Math.min(seg + 1, coords.length - 1)]
    const lat = from[0] + (to[0] - from[0]) * t
    const lng = from[1] + (to[1] - from[1]) * t

    const isDDD = line.operatorId === 'DDD'
    const isTracked = bus.id === trackedBusId
    const radius = isDDD ? (isTracked ? 9 : 6) : (isTracked ? 7 : 4)
    const color = isTracked ? '#fbbf24' : line.color
    const weight = isTracked ? 3 : 1.5

    if (busCircles.has(bus.id)) {
      const circle = busCircles.get(bus.id)!
      circle.setLatLng([lat, lng])
      circle.setStyle({ radius, fillColor: color, color: isTracked ? '#f59e0b' : '#fff', weight, opacity:1, fillOpacity:1 })
    } else {
      const circle = L.circleMarker([lat, lng], {
        renderer: canvasRenderer,
        radius,
        fillColor: color,
        fillOpacity: 1,
        color: isTracked ? '#f59e0b' : '#fff',
        weight,
      })
      circle.on('click', () => {
        trackedBusId = bus.id
        selectedStopId = null
        if (leafletMap) leafletMap.panTo([lat, lng], { animate: true })
        render()
      })
      circle.addTo(leafletMap)
      busCircles.set(bus.id, circle)
    }
  })
}

// ── Fleet stats ────────────────────────────────────────────────────────────
function getFleetStats() {
  const dddCount = buses.filter(b => lines.find(l=> l.id===b.lineId)?.operatorId === 'DDD').length
  const aftuCount = buses.length - dddCount
  return { dddCount, aftuCount }
}

// ── RENDER ─────────────────────────────────────────────────────────────────
function render() {
  const isMapTab = activeTab === 'map'
  mapLayer.style.display = 'block'

  if (isMapTab) {
    uiLayer.innerHTML = renderMapOverlay()
  } else {
    uiLayer.innerHTML = `
      <div class="page" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
        ${renderPage()}
      </div>
      ${renderTabBar()}
    `
  }

  if (showIncident && selectedStopId) uiLayer.innerHTML += renderIncidentModal()
  attachListeners()
  if (isMapTab) setTimeout(() => { initMap(); updateBusMarkers() }, 50)
}

// ── Map Overlay ────────────────────────────────────────────────────────────
function renderMapOverlay() {
  const stop = selectedStopId ? stops.find(s => s.id === selectedStopId) : null
  const tracked = trackedBusId ? buses.find(b => b.id === trackedBusId) : null
  const { dddCount, aftuCount } = getFleetStats()

  return `
    <div class="map-overlay" style="flex:1;display:flex;flex-direction:column;pointer-events:none;">
      <!-- Barre supérieure : filtre opérateur + stats flotte -->
      <div style="padding:44px 12px 0;display:flex;gap:8px;align-items:flex-start;pointer-events:none;">
        <!-- Filtre opérateur -->
        <div style="display:flex;gap:6px;pointer-events:auto;">
          ${['all','DDD','AFTU-TATA'].map(f => `
            <button class="op-filter-btn ${mapOperatorFilter===f?'active':''}" data-op="${f}"
              style="padding:6px 12px;border-radius:20px;border:none;font-size:12px;font-weight:700;
              background:${mapOperatorFilter===f ? (f==='DDD'?'#1565c0':f==='AFTU-TATA'?'#e65100':'#3aaa60') : 'rgba(255,255,255,0.92)'};
              color:${mapOperatorFilter===f?'#fff':'#333'};cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
              ${f==='all'?'Tous':f}
            </button>`).join('')}
        </div>
        <!-- Mini panel flotte -->
        <div style="pointer-events:auto;margin-left:auto;display:flex;flex-direction:column;gap:6px;">
          <div class="fleet-pill" style="background:rgba(21,101,192,0.92);">
            <strong>DDD</strong> · ${dddCount} bus · 150 lignes
          </div>
          <div class="fleet-pill" style="background:rgba(230,81,0,0.92);">
            <strong>AFTU-TATA</strong> · ${aftuCount} car rap. · 200 lignes
          </div>
        </div>
      </div>

      <div style="flex:1;"></div>

      ${tracked ? renderBusTrackingSheet(tracked) : stop ? renderStopSheet(stop) : renderMapBottomBar()}
    </div>
    ${renderTabBar()}
  `
}

function renderMapBottomBar() {
  return `
    <div class="map-bottom-bar" style="pointer-events:auto;">
      <button class="search-pill" id="go-search">
        <div class="search-pill-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span>On va où ?</span>
        </div>
        <div class="search-pill-right">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </button>
    </div>
  `
}

function renderBusTrackingSheet(bus: typeof buses[0]) {
  const line = lines.find(l => l.id === bus.lineId)
  if (!line) return ''
  const fromName = stops.find(s => s.id === line.stopIds[0])?.name ?? ''
  const toName = stops.find(s => s.id === line.stopIds[line.stopIds.length - 1])?.name ?? ''
  const pct = Math.round(bus.progress * 100)
  const isDDD = line.operatorId === 'DDD'
  const speed = bus.speedFactor >= 1.05 ? '🟢 Rapide' : bus.speedFactor >= 0.90 ? '🟡 Normal' : '🔴 Lent'
  return `
    <div class="stop-sheet" style="pointer-events:auto;position:relative;">
      <div class="sheet-handle"></div>
      <button class="sheet-close" id="close-sheet">✕</button>
      <!-- Badge opérateur -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="background:${line.color};color:#fff;padding:6px 14px;border-radius:10px;font-weight:800;font-size:16px;">${line.code}</div>
        <div>
          <div class="stop-sheet-title">🚌 ${bus.id}</div>
          <div class="stop-sheet-sub">${isDDD ? 'DakarDemDikk' : 'AFTU-TATA Car Rapide'} · ${bus.plate}</div>
        </div>
      </div>
      <!-- Route -->
      <div style="background:var(--bg);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-size:13px;color:var(--muted);margin-bottom:4px;">Ligne ${line.name.split('—')[0].trim()}</div>
        <div style="font-size:14px;font-weight:600;">📍 ${escapeHtml(fromName)}</div>
        <div style="font-size:12px;color:var(--green);margin:4px 0;">↓ ${pct}% du trajet effectué</div>
        <div style="font-size:14px;font-weight:600;">🏁 ${escapeHtml(toName)}</div>
      </div>
      <!-- Progress bar -->
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:12px;">
        <div style="height:100%;width:${pct}%;background:${line.color};border-radius:3px;transition:width 1s;"></div>
      </div>
      <!-- Stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        <div style="background:var(--bg);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:18px;font-weight:700;color:var(--text);">${bus.passengers}</div>
          <div style="font-size:10px;color:var(--muted);">/ ${bus.capacity} pass.</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:13px;font-weight:700;">${speed}</div>
          <div style="font-size:10px;color:var(--muted);">Vitesse</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:14px;font-weight:700;color:var(--green);">${line.frequencyMin} min</div>
          <div style="font-size:10px;color:var(--muted);">Fréquence</div>
        </div>
      </div>
      <button class="btn-outline" id="untrack-btn">Arrêter le suivi</button>
    </div>
  `
}

function renderStopSheet(stop: { id: string; name: string; district: string }) {
  const preds = getPredictions(stop.id).slice(0, 5)
  const isFav = favorites.some(f => f.id === stop.id)
  return `
    <div class="stop-sheet" style="pointer-events:auto;position:relative;">
      <div class="sheet-handle"></div>
      <button class="sheet-close" id="close-sheet">✕</button>
      <div class="stop-sheet-header">
        <div class="stop-sheet-title">${escapeHtml(stop.name)}</div>
        <button class="fav-btn-sm" id="fav-stop" data-id="${stop.id}">${isFav ? '⭐' : '☆'}</button>
      </div>
      <div class="stop-sheet-sub">${stop.district} · Dakar</div>
      <div class="pred-list">
        ${preds.length > 0 ? preds.map(p => `
          <div class="pred-row">
            <span class="pred-line-badge" style="background:${p.line.color};min-width:44px;font-size:11px;">${p.line.code}</span>
            <div class="pred-info">
              <div class="pred-name">${escapeHtml(p.line.headsign)}</div>
              <div class="pred-dir" style="font-size:10px;">${p.line.operatorId === 'DDD' ? '🔵 DDD' : '🟠 AFTU-TATA'}</div>
            </div>
            <div class="pred-eta ${p.etaMin <= 2 ? 'urgent' : ''}">${formatEta(p.etaMin)}</div>
          </div>
        `).join('') : '<p class="empty-msg">Aucun véhicule en approche</p>'}
      </div>
      <div class="sheet-actions">
        <button class="btn-green" id="toggle-notif">
          ${notifiedStops.includes(stop.id) ? '🔔 Actif' : '🔕 M\'avertir'}
        </button>
        <button class="btn-danger" id="btn-incident">⚠️ Signaler</button>
      </div>
    </div>
  `
}

// ── Pages ──────────────────────────────────────────────────────────────────
function renderPage() {
  if (activeTab === 'search') return renderSearch()
  if (activeTab === 'lines')  return renderLines()
  if (activeTab === 'profile') return renderProfile()
  return ''
}

function renderSearch() {
  return `
    <div class="search-header">
      <div class="search-input-row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="search-input" type="text" placeholder="Ligne ou destination"
          value="${escapeHtml(searchQuery)}" autocomplete="off" autocorrect="off"
          autocapitalize="off" spellcheck="false" />
        <button class="swap-btn" title="Effacer" id="clear-search">
          ${searchQuery ? '✕' : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/>
          </svg>`}
        </button>
      </div>
    </div>
    <div class="search-body" id="search-results-body">
      ${renderSearchBody()}
    </div>
  `
}

function renderSearchBody(): string {
  const results = searchQuery.length > 1 ? getSearchResults(searchQuery) : []
  if (searchQuery.length === 0) { return `
    <div class="action-cards">
      <button class="action-card" id="pick-on-map">
        <div class="action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
        <span class="action-label">Choisir sur la carte</span><span class="action-chevron">›</span>
      </button>
      <button class="action-card" id="set-home">
        <div class="action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <span class="action-label">Définir un domicile</span><span class="action-chevron">›</span>
      </button>
      <button class="action-card" id="set-work">
        <div class="action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
        <span class="action-label">Définir un lieu de travail</span><span class="action-chevron">›</span>
      </button>
      <button class="action-card" id="show-events">
        <div class="action-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <span class="action-label">Afficher événements</span><span class="action-chevron">›</span>
      </button>
    </div>
    ${searchHistory.length > 0 ? `
      <div class="section-title" style="margin-top:20px;">Recherches récentes</div>
      <div class="recent-list">
        ${searchHistory.map(h => `
          <div class="recent-item" data-search="${escapeHtml(h)}">
            <div class="recent-pin"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
            <div class="recent-text">
              <div class="recent-name">${escapeHtml(h)}</div>
              <div class="recent-sub">${h}, Dakar, Sénégal</div>
            </div>
            <button class="recent-more">⋮</button>
          </div>`).join('')}
      </div>` : ''}
  `}

  if (results.length > 0) {
    return `<div class="results-list">
      ${results.map(r => {
        if (r.type === 'stop') return `
          <div class="result-item" data-stop-id="${r.stop.id}">
            <div class="result-icon" style="background:#4a90d9;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
            <div class="result-text">
              <div class="result-name">${escapeHtml(r.stop.name)}</div>
              <div class="result-sub">${r.stop.district} · Dakar</div>
            </div>
          </div>`
        return `
          <div class="result-item" data-line-id="${r.line.id}">
            <div class="result-icon" style="background:${r.line.color};font-size:11px;">${r.line.code}</div>
            <div class="result-text">
              <div class="result-name">${escapeHtml(r.line.name)}</div>
              <div class="result-sub">${r.line.operatorId === 'DDD' ? '🔵 DDD' : '🟠 AFTU-TATA'} · ${r.line.frequencyMin} min</div>
            </div>
          </div>`
      }).join('')}
    </div>`
  }

  return `<div style="text-align:center;padding:40px 20px;color:var(--muted);">
    <div style="font-size:40px;margin-bottom:12px;">🔍</div>
    <div style="font-size:15px;">Aucun résultat pour « ${escapeHtml(searchQuery)} »</div>
  </div>`
}

function updateSearchResults() {
  const body = uiLayer.querySelector<HTMLElement>('#search-results-body')
  if (!body) return
  body.innerHTML = renderSearchBody()
  attachSearchBodyListeners()
}

function attachSearchBodyListeners() {
  uiLayer.querySelector('#pick-on-map')?.addEventListener('click', () => { activeTab = 'map'; render() })
  uiLayer.querySelector('#set-home')?.addEventListener('click', () => alert('Fonctionnalité domicile à venir'))
  uiLayer.querySelector('#set-work')?.addEventListener('click', () => alert('Fonctionnalité travail à venir'))
  uiLayer.querySelector('#show-events')?.addEventListener('click', () => alert('Aucun événement en cours'))

  uiLayer.querySelectorAll<HTMLElement>('.recent-item').forEach(item => {
    item.addEventListener('click', () => { searchQuery = item.dataset.search || ''; updateSearchResults() })
  })
  uiLayer.querySelectorAll<HTMLElement>('.result-item[data-stop-id]').forEach(item => {
    item.addEventListener('click', () => {
      const stopId = item.dataset.stopId!
      selectedStopId = stopId; activeTab = 'map'; searchQuery = ''
      if (leafletMap && GPS[stopId]) leafletMap.setView(GPS[stopId], 15)
      render()
    })
  })
}

function renderLines() {
  const filtered = lines.filter(l => {
    if (lineFilter === 'DDD') return l.operatorId === 'DDD'
    if (lineFilter === 'AFTU-TATA') return l.operatorId === 'AFTU-TATA'
    return true
  })
  const dddCount = lines.filter(l => l.operatorId === 'DDD').length
  const aftuCount = lines.filter(l => l.operatorId === 'AFTU-TATA').length
  return `
    <div class="page-header">
      <h2>Réseau de Dakar</h2>
      <p>🔵 DDD : ${dddCount} lignes &nbsp;|&nbsp; 🟠 AFTU-TATA : ${aftuCount} lignes</p>
    </div>
    <div class="filter-row">
      <button class="filter-chip ${lineFilter==='all'?'active':''}" data-filter="all">Tous (350)</button>
      <button class="filter-chip ${lineFilter==='DDD'?'active':''}" data-filter="DDD">🔵 DDD (150)</button>
      <button class="filter-chip ${lineFilter==='AFTU-TATA'?'active':''}" data-filter="AFTU-TATA">🟠 AFTU-TATA (200)</button>
    </div>
    <div class="lines-list">
      ${filtered.slice(0, 100).map(l => `
        <button class="line-card" data-line-id="${l.id}">
          <div class="line-number" style="background:${l.color};font-size:13px;">${l.code}</div>
          <div class="line-info">
            <div class="line-name" style="font-size:13px;">${escapeHtml(l.name.split('—')[1]?.trim() ?? l.name)}</div>
            <div class="line-detail">${l.frequencyMin} min · ${l.stopIds.length} arrêts</div>
          </div>
          <span class="line-badge" style="background:${l.operatorId==='DDD'?'#dbeafe':'#fef3c7'};color:${l.operatorId==='DDD'?'#1d4ed8':'#92400e'};">
            ${l.operatorId === 'DDD' ? 'DDD' : 'AFTU'}
          </span>
        </button>`).join('')}
      ${filtered.length > 100 ? `<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">... et ${filtered.length - 100} lignes supplémentaires</div>` : ''}
    </div>
  `
}

function renderProfile() {
  const { dddCount, aftuCount } = getFleetStats()
  return `
    <div style="background:var(--green);padding:48px 16px 20px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;">U</div>
        <div>
          <div style="font-size:18px;font-weight:700;color:#fff;">Utilisateur SunuBus</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8);">Dakar, Sénégal</div>
        </div>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:16px;">
      <!-- Stats réseau -->
      <div class="profile-card">
        <div class="profile-card-title">📊 Réseau SunuBus</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);">
          ${[
            ['350','Lignes totales'],['61','Arrêts'],
            [`${dddCount}`,'Bus DDD actifs'],[`${aftuCount}`,'Tata AFTU actifs'],
            ['150','Lignes DDD'],['200','Lignes AFTU'],
          ].map(([v,l]) => `
            <div style="background:var(--white);padding:14px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:var(--green);">${v}</div>
              <div style="font-size:11px;color:var(--muted);">${l}</div>
            </div>`).join('')}
        </div>
      </div>
      <!-- Favoris -->
      <div class="profile-card">
        <div class="profile-card-title">⭐ Favoris</div>
        ${favorites.length > 0 ? `<div class="fav-chips">${favorites.map(f => {
          const item = f.type==='line' ? lines.find(l=>l.id===f.id) : stops.find(s=>s.id===f.id)
          return `<div class="fav-chip">${f.type==='line'?'🚌':'📍'} ${item?.name??f.id}</div>`
        }).join('')}</div>` : '<p class="empty-msg">Aucun favori</p>'}
      </div>
      <!-- Surveillance -->
      <div class="profile-card">
        <div class="profile-card-title">📡 Arrêts surveillés</div>
        ${notifiedStops.length > 0
          ? notifiedStops.map(id => `<div class="history-item"><span>🔔</span><span>${stops.find(s=>s.id===id)?.name??id}</span></div>`).join('')
          : '<p class="empty-msg">Aucune surveillance active</p>'}
      </div>
    </div>
  `
}

function renderTabBar() {
  const tabs: { id: Tab; label: string; path: string }[] = [
    { id:'map',     label:'Carte',     path:'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' },
    { id:'search',  label:'Recherche', path:'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' },
    { id:'lines',   label:'Lignes',    path:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
    { id:'profile', label:'Profil',    path:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  ]
  return `<div class="bottom-tab-bar">
    ${tabs.map(t => `
      <button class="tab-btn ${activeTab===t.id?'active':''}" data-tab="${t.id}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="${t.path}"/>
        </svg>
        ${t.label}
      </button>`).join('')}
  </div>`
}

function renderIncidentModal() {
  return `
    <div class="incident-modal" id="incident-modal">
      <div class="incident-panel">
        <div class="sheet-handle" style="width:40px;height:4px;background:#e2e6ea;border-radius:2px;margin:0 auto 20px;"></div>
        <h3>Signalement d'incident</h3>
        <p>Aidez-nous à améliorer le réseau dakarois.</p>
        <div class="incident-grid">
          ${[['👥','Bus bondé','Plus de place assise','crowded'],['⏳','Retard majeur','+15 min d\'attente','delay'],['⚠️','Sécurité','Conduite ou incident','dangerous'],['💬','Autre','Préciser par message','other']].map(([i,t,s,v])=>`
            <button class="incident-opt" data-type="${v}">
              <span class="inc-icon">${i}</span><strong>${t}</strong><small>${s}</small>
            </button>`).join('')}
        </div>
        <button class="btn-cancel" id="cancel-incident">Fermer</button>
      </div>
    </div>`
}

// ── Listeners ──────────────────────────────────────────────────────────────
function attachListeners() {
  // Tabs
  uiLayer.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab as Tab
      if (activeTab !== 'map') selectedStopId = null
      render()
    })
  })

  // Operator filter on map
  uiLayer.querySelectorAll<HTMLButtonElement>('.op-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mapOperatorFilter = btn.dataset.op as any
      render()
      setTimeout(updateBusMarkers, 50)
    })
  })

  // "On va où ?" pill
  uiLayer.querySelector('#go-search')?.addEventListener('click', () => {
    activeTab = 'search'; render()
    setTimeout(() => (uiLayer.querySelector<HTMLInputElement>('#search-input'))?.focus(), 100)
  })
  // Close stop sheet
  uiLayer.querySelector('#close-sheet')?.addEventListener('click', () => {
    selectedStopId = null; trackedBusId = null; render()
  })
  // Untrack bus
  uiLayer.querySelector('#untrack-btn')?.addEventListener('click', () => {
    trackedBusId = null; render()
  })
  // Fav stop
  uiLayer.querySelector('#fav-stop')?.addEventListener('click', e => {
    const id = (e.currentTarget as HTMLElement).dataset.id!
    const idx = favorites.findIndex(f => f.id === id)
    if (idx === -1) favorites.push({ type:'stop', id })
    else favorites.splice(idx, 1)
    render()
  })
  // Toggle notif
  uiLayer.querySelector('#toggle-notif')?.addEventListener('click', () => {
    if (!selectedStopId) return
    if (notifiedStops.includes(selectedStopId)) notifiedStops = notifiedStops.filter(s => s !== selectedStopId)
    else { notifiedStops.push(selectedStopId); alert(`✅ Vous serez averti pour ${stops.find(s=>s.id===selectedStopId)?.name}`) }
    render()
  })
  // Incident
  uiLayer.querySelector('#btn-incident')?.addEventListener('click', () => { showIncident = true; render() })
  uiLayer.querySelectorAll<HTMLElement>('.incident-opt').forEach(btn => {
    btn.addEventListener('click', () => { showIncident = false; alert('✅ Signalement envoyé !'); render() })
  })
  uiLayer.querySelector('#cancel-incident')?.addEventListener('click', () => { showIncident = false; render() })

  // Search input
  const searchInput = uiLayer.querySelector<HTMLInputElement>('#search-input')
  if (searchInput) {
    searchInput.addEventListener('input', () => { searchQuery = searchInput.value; updateSearchResults() })
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        const trimmed = searchQuery.trim()
        searchHistory = [trimmed, ...searchHistory.filter(h => h !== trimmed)].slice(0, 5)
        searchQuery = ''; searchInput.value = ''; updateSearchResults()
      }
      if (e.key === 'Escape') { searchQuery = ''; searchInput.value = ''; updateSearchResults() }
    })
  }
  uiLayer.querySelector('#clear-search')?.addEventListener('click', () => {
    searchQuery = ''
    const inp = uiLayer.querySelector<HTMLInputElement>('#search-input')
    if (inp) inp.value = ''
    updateSearchResults()
  })
  attachSearchBodyListeners()

  // Line filter
  uiLayer.querySelectorAll<HTMLElement>('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => { lineFilter = chip.dataset.filter as any; render() })
  })
}

// ── Tick loop (toutes les 1.5s) ────────────────────────────────────────────
window.setInterval(() => {
  tickBuses()
  if (activeTab === 'map') {
    updateBusMarkers()
    // Suivre le bus tracké
    if (trackedBusId) {
      const bus = buses.find(b => b.id === trackedBusId)
      const line = bus ? lines.find(l => l.id === bus.lineId) : null
      if (bus && line && leafletMap) {
        const coords = line.stopIds.map(id => GPS[id]).filter(Boolean) as [number,number][]
        if (coords.length >= 2) {
          const seg = Math.min(Math.floor(bus.progress * (coords.length - 1)), coords.length - 2)
          const t = bus.progress * (coords.length - 1) - seg
          const lat = coords[seg][0] + (coords[seg+1][0] - coords[seg][0]) * t
          const lng = coords[seg][1] + (coords[seg+1][1] - coords[seg][1]) * t
          leafletMap.panTo([lat, lng], { animate: true, duration: 1 })
        }
      }
      render()
    }
  }
}, 1500)

// ── Boot ───────────────────────────────────────────────────────────────────
render()
setTimeout(initMap, 100)
