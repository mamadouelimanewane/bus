import { lines } from './data/network'
import './style_driver.css'

let selectedLineId: string | null = null
let isDriving = false
let isDeviated = false
let currentProgress = 0
let activeMessage: any = null
const DRIVER_BUS_ID = "BUS-DDD-1"

const root = document.querySelector<HTMLDivElement>('#driver-app')!

function checkMessages() {
    const messages = JSON.parse(localStorage.getItem('sunubus_messages') || '[]')
    const myMsg = messages.find((m: any) => m.to === DRIVER_BUS_ID && !m.read)
    if (myMsg && !activeMessage) {
        activeMessage = myMsg
        render()
    }
}

function acknowledgeMessage() {
    if (!activeMessage) return
    const messages = JSON.parse(localStorage.getItem('sunubus_messages') || '[]')
    const idx = messages.findIndex((m: any) => m.id === activeMessage.id)
    if (idx !== -1) {
        messages[idx].read = true
        localStorage.setItem('sunubus_messages', JSON.stringify(messages))
    }
    activeMessage = null
    render()
}

function reportGeofence(deviated: boolean) {
    const breaches = JSON.parse(localStorage.getItem('sunubus_geofence') || '[]')
    const existingIdx = breaches.findIndex((b:any) => b.busId === DRIVER_BUS_ID)
    if (deviated) {
        if (existingIdx === -1) breaches.push({ busId: DRIVER_BUS_ID, timestamp: new Date().toISOString() })
    } else {
        if (existingIdx !== -1) breaches.splice(existingIdx, 1)
    }
    localStorage.setItem('sunubus_geofence', JSON.stringify(breaches))
}

function render() {
    root.innerHTML = `
        <header>
            <div class="driver-id">CHAUFFEUR #782 (${DRIVER_BUS_ID})</div>
            <div class="status-dot ${isDriving?'live':''}"></div>
        </header>

        ${activeMessage ? `
            <div class="driver-alert">
                <div class="alert-icon">✉️</div>
                <div class="alert-body">
                    <strong>Message du Central</strong>
                    <p>${activeMessage.text}</p>
                </div>
                <button class="ack-btn" id="ack-msg">REÇU</button>
            </div>
        ` : ''}

        ${!isDriving ? `
            <div class="trip-selector">
                <h2>Sélectionnez votre ligne</h2>
                <div class="selector-grid">
                    ${lines.slice(0,6).map(l => `
                        <div class="selector-card ${selectedLineId === l.id ? 'active' : ''}" data-id="${l.id}">
                            <div class="line-dot" style="background:${l.color}"></div>
                            <strong>LIGNE ${l.code}</strong>
                            <p>${l.name}</p>
                        </div>
                    `).join('')}
                </div>
                <button class="big-btn" id="start-job" ${!selectedLineId ? 'disabled' : ''}>DÉMARRER LE SERVICE</button>
            </div>
        ` : `
            <div class="on-trip-view">
                <div class="live-status">EN MISSION ${isDeviated ? '<span style="color:#ef4444">(HORS TRAJET)</span>' : ''}</div>
                <div class="trip-metrics">
                    <div class="metric">
                        <span>Progression</span>
                        <strong style="${isDeviated?'color:#ef4444':''}">${Math.round(currentProgress * 100)}%</strong>
                    </div>
                </div>
                <div class="progress-bar-driver"><div style="width:${currentProgress*100}%; background:${isDeviated?'#ef4444':''}"></div></div>
                
                <button class="big-btn" id="toggle-deviation" style="background:${isDeviated?'#334155':'#1e293b'}; margin-bottom:12px; border:1px solid #475569;">
                    ${isDeviated ? 'REPRENDRE L\'ITINÉRAIRE' : 'DÉVIATION (ITINÉRAIRE BIS)'}
                </button>

                <div style="display:flex; gap:12px; width:100%;">
                    <button class="big-btn stop-now" id="stop-job" style="flex:1;">FIN SERVICE</button>
                    <button class="big-btn" id="report-panic" style="background:#eab308; box-shadow:0 10px 20px rgba(234,179,8,0.2); flex:1;">PANNE</button>
                </div>
            </div>
        `}
    `
    attachListeners()
}

function attachListeners() {
    root.querySelectorAll<HTMLElement>('.selector-card').forEach(card => {
        card.onclick = () => { selectedLineId = card.dataset.id!; render() }
    })
    root.querySelector('#start-job')?.addEventListener('click', () => { isDriving = true; simulateGPS(); render(); })
    root.querySelector('#stop-job')?.addEventListener('click', () => { isDriving = false; render(); })
    root.querySelector('#toggle-deviation')?.addEventListener('click', () => { isDeviated = !isDeviated; reportGeofence(isDeviated); render(); })
    root.querySelector('#report-panic')?.addEventListener('click', () => {
        const incidents = JSON.parse(localStorage.getItem('sunubus_incidents') || '[]')
        incidents.push({ busId: DRIVER_BUS_ID, type: 'PANNE_TECHNIQUE', timestamp: new Date().toISOString(), resolved: false })
        localStorage.setItem('sunubus_incidents', JSON.stringify(incidents))
        alert('Panne signalée.'); render()
    })
    root.querySelector('#ack-msg')?.addEventListener('click', acknowledgeMessage)
}

function simulateGPS() {
    if (!isDriving) return
    if (!isDeviated) currentProgress = (currentProgress + 0.005) % 1
    checkMessages()
    setTimeout(() => { if(isDriving) { simulateGPS(); render(); } }, 2000)
}

render()
setInterval(checkMessages, 5000)
