let simMap = null;
let simPathCoords = [];
let simAnimationId = null;
let simProgress = 0;
let simIsPlaying = false;
let simSpeed = 1.0;
let simStartTime = null;
let simTotalDistance = 0;
let simOverlayEl = null;
let simGoogleMapsLoaded = false;
let simLastRenderTime = 0;
let simCurrentHeading = null;
let simRoutePolyline = null;
let simProgressPolyline = null;
let simCurrentZoom = 17;
let simCurrentTilt = 60;
let simStartMarker = null;
let simEndMarker = null;
let simWaypointMarkers = [];
let simWaypointLabels = [];
let simVehicleMarker = null;
let simStopPoints = [];
let simStoppedIndexes = [];
let simStopTimer = null;
let AdvancedMarkerElement = null;
let simMapMode = "3d";
let simCurrentWaypoints = [];
let simCurrentDetailedPath = [];
let isTogglingSimMode = false;
const isDemoLocked = true;

async function fetchWithSimTimeout(url, options = {}, timeoutMs = 4500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

function clearSimArrivalBanners() {
    document.querySelectorAll(".sim3d-arrival-banner").forEach(el => el.remove());
}

const spotCategories = {
    "清水寺": "history",
    "有馬温泉": "healing",
    "道頓堀": "food",
    "奈良公園": "nature",
    "メタセコイア並木": "nature",
    "那智の滝": "nature",
    "姫路城": "history",
    "嵐山竹林の小径": "nature",
    "白良浜": "nature",
    "比叡山延暦寺": "history",
    "黒門市場": "food",
    "伏見稲荷大社": "history",
    "竹田城跡": "history",
    "吉野山": "nature",
    "高野山 金剛峯寺": "history",
    "近江八幡の水郷": "nature",
    "天橋立": "nature",
    "彦根城": "history",
    "アドベンチャーワールド": "nature",
    "熊野古道": "nature",
    "大阪城公園": "nature",
    "法隆寺": "history",
    "城崎温泉": "healing",
    "天龍寺": "history",
    "琵琶湖バレイ": "nature",
    "六甲山テラス": "nature"
};

function getSpotCategory(name) {
    if (!name) return "default";
    if (name.includes("出発地") || name === "S") return "start";
    if (name.includes("目的地") || name === "G") return "goal";
    for (const key in spotCategories) {
        if (name.includes(key)) {
            return spotCategories[key];
        }
    }
    return "default";
}

function createCustomMarkerIcon(category) {
    let strokeColor = "#00f3ff";
    let fillColor = "#0f172a";
    let iconContent = "";
    if (category === "history") {
        strokeColor = "#F59E0B";
        iconContent = '<path d="M4 6h16v2h-2v12h-2V8H8v12H6V8H4V6zm3 4h10v2H7v-2z" fill="' + strokeColor + '"/>';
    } else if (category === "healing") {
        strokeColor = "#10B981";
        iconContent = '<path d="M7 19c.5 0 .9-.2 1.3-.5.5-.3.8-.5 1.2-.5s.7.2 1.2.5c.5.3 1 .5 1.6.5s1.1-.2 1.6-.5c.5-.3.7-.5 1.2-.5.4 0 .7.2 1.2.5.4.3.8.5 1.3.5v-2c-.5 0-.9-.2-1.3-.5-.5-.3-.8-.5-1.2-.5s-.7.2-1.2.5c-.5.3-1 .5-1.6.5s-1.1-.2-1.6-.5c-.5-.3-.7-.5-1.2-.5-.4 0-.7.2-1.2.5-.4.3-.8.5-1.3.5v2zm0-4c.5 0 .9-.2 1.3-.5.5-.3.8-.5 1.2-.5s.7.2 1.2.5c.5.3 1 .5 1.6.5s1.1-.2 1.6-.5c.5-.3.7-.5 1.2-.5.4 0 .7.2 1.2.5.4.3.8.5 1.3.5v-2c-.5 0-.9-.2-1.3-.5-.5-.3-.8-.5-1.2-.5s-.7.2-1.2.5c-.5.3-1 .5-1.6.5s-1.1-.2-1.6-.5c-.5-.3-.7-.5-1.2-.5-.4 0-.7.2-1.2.5-.4.3-.8.5-1.3.5v2zm5-11c-.83 0-1.5.67-1.5 1.5V9h3V5.5c0-.83-.67-1.5-1.5-1.5zm-4 2c-.83 0-1.5.67-1.5 1.5V9h3V7.5c0-.83-.67-1.5-1.5-1.5zm8 0c-.83 0-1.5.67-1.5 1.5V9h3V7.5c0-.83-.67-1.5-1.5-1.5z" fill="' + strokeColor + '"/>';
    } else if (category === "food") {
        strokeColor = "#F43F5E";
        iconContent = '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-8.03c2.09-.13 3.75-1.85 3.75-3.97V2H11v7zm7-3V2h-2v10h2.5v10h2.5V2c-2.76 0-5 2.24-5 5z" fill="' + strokeColor + '"/>';
    } else if (category === "nature") {
        strokeColor = "#84CC16";
        iconContent = '<path d="M12 2L4 15h3v5h10v-5h3L12 2zm0 3.3L17.2 13H15v5H9v-5H6.8L12 5.3z" fill="' + strokeColor + '"/>';
    } else if (category === "start") {
        strokeColor = "#3B82F6";
        iconContent = '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="' + strokeColor + '"/>';
    } else if (category === "goal") {
        strokeColor = "#8B5CF6";
        iconContent = '<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" fill="' + strokeColor + '"/>';
    } else {
        strokeColor = "#06B6D4";
        iconContent = '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="' + strokeColor + '"/>';
    }
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">' +
        '<circle cx="12" cy="12" r="11" fill="' + fillColor + '" stroke="' + strokeColor + '" stroke-width="2"/>' +
        iconContent +
        '</svg>';
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
    };
}

function getApiUrl(path) {
    const base = window.location.port === "3000" ? window.location.origin : "http://localhost:3000";
    return `${base}${path}`;
}

async function getSimAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (window._auth && window._auth.currentUser) {
        try {
            const token = await window._auth.currentUser.getIdToken();
            if (token) headers["Authorization"] = `Bearer ${token}`;
        } catch (e) {
            console.warn("Auth token acquisition failed in simulation:", e);
        }
    }
    return headers;
}

export async function loadGoogleMaps() {
    if (simGoogleMapsLoaded && window.google && window.google.maps) {
        if (window.google.maps.importLibrary) {
            try {
                await Promise.all([
                    google.maps.importLibrary("maps"),
                    google.maps.importLibrary("geometry"),
                    google.maps.importLibrary("geocoding"),
                    google.maps.importLibrary("places"),
                    google.maps.importLibrary("marker")
                ]);
            } catch (e) {}
        }
        return;
    }
    if (window.google && window.google.maps && window.google.maps.importLibrary) {
        await Promise.all([
            google.maps.importLibrary("maps"),
            google.maps.importLibrary("geometry"),
            google.maps.importLibrary("geocoding"),
            google.maps.importLibrary("places"),
            google.maps.importLibrary("marker")
        ]);
        simGoogleMapsLoaded = true;
        return;
    }
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = setInterval(async () => {
            attempts++;
            if (window.google && window.google.maps) {
                clearInterval(check);
                if (window.google.maps.importLibrary) {
                    try {
                        await Promise.all([
                            google.maps.importLibrary("maps"),
                            google.maps.importLibrary("geometry"),
                            google.maps.importLibrary("geocoding"),
                            google.maps.importLibrary("places"),
                            google.maps.importLibrary("marker")
                        ]);
                    } catch (e) {}
                }
                simGoogleMapsLoaded = true;
                resolve();
            } else if (attempts > 50) {
                clearInterval(check);
                reject(new Error("Google Maps API loading timed out"));
            }
        }, 100);
    });
}

export async function fetchRoutesData(originLat, originLng, destLat, destLng, intermediates = []) {
    try {
        const url = getApiUrl("/api/travel/routes");
        const headers = await getSimAuthHeaders();
        const response = await fetchWithSimTimeout(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                origin: { lat: originLat, lng: originLng },
                destination: { lat: destLat, lng: destLng },
                intermediates: intermediates
            })
        }, 5000);
        if (!response.ok) {
            throw new Error(`Routes API Error: ${response.status}`);
        }
        const data = await response.json();
        if (data.path && data.path.length > 0) {
            return data;
        }
        return null;
    } catch (err) {
        return null;
    }
}

export async function fetchPlaceDetails(query) {
    try {
        const url = getApiUrl("/api/travel/places");
        const headers = await getSimAuthHeaders();
        const response = await fetchWithSimTimeout(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ textQuery: query, purpose: "spot" })
        }, 5000);
        if (!response.ok) {
            throw new Error(`Places API Error: ${response.status}`);
        }
        const data = await response.json();
        if (data.places && data.places.length > 0) {
            return data.places[0];
        }
        return null;
    } catch (err) {
        return null;
    }
}

export function generateFallbackLatLngPath(startLat, startLng, endLat, endLng, steps) {
    const path = [];
    const count = steps || 100;
    for (let i = 0; i <= count; i++) {
        const t = i / count;
        const lat = startLat + (endLat - startLat) * t;
        const lng = startLng + (endLng - startLng) * t;
        const curveOffset = Math.sin(t * Math.PI) * 0.01;
        path.push({ lat: lat + curveOffset, lng: lng + curveOffset * 0.5 });
    }
    return path;
}

export function getPathPointAndHeading(path, progress) {
    if (!path || path.length === 0) return { lat: 0, lng: 0, heading: 0 };
    if (path.length === 1) return { lat: path[0].lat, lng: path[0].lng, heading: 0 };

    const clampedProgress = Math.max(0, Math.min(1, progress));

    if (!path._totalDist || !path._distances) {
        let total = 0;
        path._distances = [0];
        for (let i = 1; i < path.length; i++) {
            const p1 = new google.maps.LatLng(path[i - 1].lat, path[i - 1].lng);
            const p2 = new google.maps.LatLng(path[i].lat, path[i].lng);
            let d = 0;
            if (window.google?.maps?.geometry?.spherical?.computeDistanceBetween) {
                d = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
            } else {
                const dLat = (path[i].lat - path[i - 1].lat) * 111320;
                const dLng = (path[i].lng - path[i - 1].lng) * 111320 * Math.cos((path[i].lat * Math.PI) / 180);
                d = Math.sqrt(dLat * dLat + dLng * dLng);
            }
            total += d;
            path._distances.push(total);
        }
        path._totalDist = total;
    }

    const targetDist = clampedProgress * path._totalDist;
    let i = 0;
    while (i < path._distances.length - 1 && path._distances[i + 1] < targetDist) {
        i++;
    }

    const currentPoint = path[i];
    const nextPoint = path[Math.min(i + 1, path.length - 1)];
    const segmentDist = path._distances[i + 1] - path._distances[i];
    let fraction = 0;
    if (segmentDist > 0) {
        fraction = (targetDist - path._distances[i]) / segmentDist;
    }

    let lat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * fraction;
    let lng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * fraction;
    let alt1 = typeof currentPoint.alt === "number" && !isNaN(currentPoint.alt) ? currentPoint.alt : 0;
    let alt2 = typeof nextPoint.alt === "number" && !isNaN(nextPoint.alt) ? nextPoint.alt : alt1;
    let alt = alt1 + (alt2 - alt1) * fraction;
    let heading = 0;

    if (window.google?.maps?.geometry?.spherical?.computeHeading) {
        const p1 = new google.maps.LatLng(currentPoint.lat, currentPoint.lng);
        const p2 = new google.maps.LatLng(nextPoint.lat, nextPoint.lng);
        heading = google.maps.geometry.spherical.computeHeading(p1, p2);
    } else {
        const y = Math.sin((nextPoint.lng - currentPoint.lng) * Math.PI / 180) * Math.cos(nextPoint.lat * Math.PI / 180);
        const x = Math.cos(currentPoint.lat * Math.PI / 180) * Math.sin(nextPoint.lat * Math.PI / 180) -
                  Math.sin(currentPoint.lat * Math.PI / 180) * Math.cos(nextPoint.lat * Math.PI / 180) * Math.cos((nextPoint.lng - currentPoint.lng) * Math.PI / 180);
        heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }

    if (currentPoint.lat === nextPoint.lat && currentPoint.lng === nextPoint.lng) {
        heading = getPathPointAndHeading._lastHeading || 0;
    } else {
        getPathPointAndHeading._lastHeading = heading;
    }

    return { lat: lat, lng: lng, alt: alt, heading: heading };
}

async function populateRouteElevations(path) {
    if (!Array.isArray(path) || path.length === 0) return;
    const sampleCount = Math.min(80, path.length);
    const sampleIndices = [];
    for (let i = 0; i < sampleCount; i++) {
        const idx = sampleCount === 1 ? 0 : Math.round((i / (sampleCount - 1)) * (path.length - 1));
        sampleIndices.push(idx);
    }
    let sampleElevations = null;
    try {
        const lats = sampleIndices.map(idx => path[idx].lat.toFixed(5)).join(",");
        const lngs = sampleIndices.map(idx => path[idx].lng.toFixed(5)).join(",");
        const res = await fetchWithSimTimeout(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`, {}, 3500);
        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.elevation) && data.elevation.length === sampleIndices.length) {
                sampleElevations = data.elevation.map(v => (typeof v === "number" && !isNaN(v) ? Math.max(0, v) : 0));
            }
        }
    } catch (e) {}

    if (!sampleElevations) {
        try {
            const { ElevationService } = await google.maps.importLibrary("elevation");
            if (ElevationService) {
                const elevator = new ElevationService();
                const locs = sampleIndices.map(idx => ({ lat: path[idx].lat, lng: path[idx].lng }));
                const elevRes = await elevator.getElevationForLocations({ locations: locs });
                if (elevRes && Array.isArray(elevRes.results) && elevRes.results.length === sampleIndices.length) {
                    sampleElevations = elevRes.results.map(r => (r && typeof r.elevation === "number" ? Math.max(0, r.elevation) : 0));
                }
            }
        } catch (e) {}
    }

    if (!sampleElevations) {
        for (let i = 0; i < path.length; i++) {
            path[i].alt = 40;
        }
        return;
    }

    for (let s = 0; s < sampleIndices.length - 1; s++) {
        const startIdx = sampleIndices[s];
        const endIdx = sampleIndices[s + 1];
        const startAlt = sampleElevations[s];
        const endAlt = sampleElevations[s + 1];
        const span = Math.max(1, endIdx - startIdx);
        for (let k = startIdx; k <= endIdx; k++) {
            const t = (k - startIdx) / span;
            path[k].alt = startAlt + (endAlt - startAlt) * t;
        }
    }
    path[0].alt = sampleElevations[0];
    path[path.length - 1].alt = sampleElevations[sampleElevations.length - 1];
}

function calculateTotalDistance(path) {
    let total = 0;
    for (let i = 1; i < path.length; i++) {
        const dLat = (path[i].lat - path[i - 1].lat) * 111320;
        const dLng = (path[i].lng - path[i - 1].lng) * 111320 * Math.cos((path[i].lat * Math.PI) / 180);
        total += Math.sqrt(dLat * dLat + dLng * dLng);
    }
    return total;
}

export function simUpdateHUD(data) {
    const speedEl = document.getElementById("simHudSpeed");
    const distEl = document.getElementById("simHudDistance");
    const timeEl = document.getElementById("simHudTime");
    const progEl = document.getElementById("simHudProgress");
    const destEl = document.getElementById("simHudDestination");
    if (speedEl && data.speed !== undefined) {
        speedEl.textContent = `${Math.round(data.speed)} km/h`;
    }
    if (distEl && data.distance !== undefined) {
        const km = (data.distance / 1000).toFixed(1);
        distEl.textContent = `${km} km`;
    }
    if (timeEl && (data.estimatedTime !== undefined || data.elapsed !== undefined)) {
        const totalSeconds = data.estimatedTime !== undefined ? data.estimatedTime : data.elapsed;
        const totalMins = Math.floor(totalSeconds / 60);
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        timeEl.textContent = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    }
    if (progEl && data.progress !== undefined) {
        progEl.style.width = `${Math.round(data.progress * 100)}%`;
    }
    if (destEl && data.destination !== undefined) {
        destEl.textContent = data.destination;
    }
}

function bindSimControlEvents() {
    const closeBtn = document.getElementById("simCloseBtn");
    if (closeBtn) {
        closeBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            close3DRouteSimulation();
        };
    }
    const playBtn = document.getElementById("simPlayBtn");
    if (playBtn) {
        playBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            start3DAnimation();
        };
    }
    const pauseBtn = document.getElementById("simPauseBtn");
    if (pauseBtn) {
        pauseBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            pause3DAnimation();
        };
    }
    const resetBtn = document.getElementById("simResetBtn");
    if (resetBtn) {
        resetBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            reset3DAnimation();
        };
    }
    const modeBtn = document.getElementById("simModeToggleBtn");
    if (modeBtn) {
        modeBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSimMapMode();
        };
    }
    const speedSlider = document.getElementById("simSpeedSlider");
    if (speedSlider) {
        speedSlider.oninput = function (e) {
            e.stopPropagation();
            simSpeed = parseFloat(e.target.value) || 1;
        };
        speedSlider.onchange = function (e) {
            e.stopPropagation();
            simSpeed = parseFloat(e.target.value) || 1;
        };
    }
    const controlsBar = document.querySelector(".sim3d-controls");
    if (controlsBar) {
        controlsBar.onpointerdown = function (e) { e.stopPropagation(); };
        controlsBar.onmousedown = function (e) { e.stopPropagation(); };
        controlsBar.ontouchstart = function (e) { e.stopPropagation(); };
    }
}

function renderSimOverlay() {
    if (document.getElementById("sim3dOverlay")) {
        simOverlayEl = document.getElementById("sim3dOverlay");
        if (!document.getElementById("simModeToggleBtn")) {
            const controls = simOverlayEl.querySelector(".sim3d-controls");
            if (controls) {
                const modeBtn = document.createElement("button");
                modeBtn.type = "button";
                modeBtn.className = "sim3d-mode-btn";
                modeBtn.id = "simModeToggleBtn";
                modeBtn.title = "地図モード切替";
                modeBtn.innerHTML = `<span class="material-icons" style="font-size:1rem;">view_in_ar</span><span id="simModeToggleLabel">${simMapMode === "3d" ? "2D/ベクター切替" : "リアル3D切替"}</span>`;
                controls.appendChild(modeBtn);
            }
        }
        bindSimControlEvents();
        return;
    }
    const overlay = document.createElement("div");
    overlay.id = "sim3dOverlay";
    overlay.className = "sim3d-overlay hidden";
    overlay.innerHTML = `
        <div class="sim3d-header">
            <div class="sim3d-header-left">
                <span class="material-icons" style="color: var(--primary-color); font-size: 1.3rem;">route</span>
                <span class="sim3d-title">3D Route Simulation</span>
            </div>
            <div class="sim3d-destination" id="simHudDestination"></div>
            <button type="button" class="sim3d-close-btn" id="simCloseBtn">
                <span class="material-icons">close</span>
            </button>
        </div>
        <div class="sim3d-map-container" id="sim3dMapContainer"></div>
        <div class="sim3d-hud">
            <div class="sim3d-hud-item">
                <span class="material-icons sim3d-hud-icon">speed</span>
                <div class="sim3d-hud-label">Speed</div>
                <div class="sim3d-hud-value" id="simHudSpeed">0 km/h</div>
            </div>
            <div class="sim3d-hud-item">
                <span class="material-icons sim3d-hud-icon">straighten</span>
                <div class="sim3d-hud-label">Distance</div>
                <div class="sim3d-hud-value" id="simHudDistance">0 km</div>
            </div>
            <div class="sim3d-hud-item">
                <span class="material-icons sim3d-hud-icon">timer</span>
                <div class="sim3d-hud-label">Time</div>
                <div class="sim3d-hud-value" id="simHudTime">00:00</div>
            </div>
        </div>
        <div class="sim3d-progress-track">
            <div class="sim3d-progress-fill" id="simHudProgress"></div>
        </div>
        <div class="sim3d-controls">
            <button type="button" class="sim3d-ctrl-btn" id="simResetBtn" title="Reset">
                <span class="material-icons">replay</span>
            </button>
            <button type="button" class="sim3d-ctrl-btn sim3d-ctrl-play" id="simPlayBtn" title="Start">
                <span class="material-icons">play_arrow</span>
            </button>
            <button type="button" class="sim3d-ctrl-btn" id="simPauseBtn" title="Pause">
                <span class="material-icons">pause</span>
            </button>
            <div class="sim3d-speed-control">
                <label class="sim3d-speed-label">Speed</label>
                <input type="range" id="simSpeedSlider" min="0.5" max="10" step="0.5" value="1" class="sim3d-speed-slider">
            </div>
            <button type="button" class="sim3d-mode-btn" id="simModeToggleBtn" title="地図モード切替">
                <span class="material-icons" style="font-size:1rem;">view_in_ar</span>
                <span id="simModeToggleLabel">2D/ベクター切替</span>
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    simOverlayEl = overlay;
    bindSimControlEvents();
}

function animateStep(timestamp) {
    if (!simIsPlaying) return;
    const frameDuration = 1000 / 30;
    if (simLastRenderTime && timestamp - simLastRenderTime < frameDuration) {
        simAnimationId = requestAnimationFrame(animateStep);
        return;
    }
    simLastRenderTime = timestamp;
    if (!simStartTime) simStartTime = timestamp;
    const elapsed = (timestamp - simStartTime) / 1000;
    const rawDelta = animateStep._lastTimestamp ? (timestamp - animateStep._lastTimestamp) / 1000 : 0.033;
    const delta = Math.min(0.2, Math.max(0.005, rawDelta));
    animateStep._lastTimestamp = timestamp;
    const totalDistKm = simTotalDistance / 1000;
    const baseSpeedMps = 30;
    const currentMps = baseSpeedMps * simSpeed;
    const totalDist = Math.max(1, simTotalDistance);
    simProgress += (currentMps * delta) / totalDist;
    simStopPoints.forEach(function(stop, idx) {
        if (simStoppedIndexes.indexOf(idx) !== -1) return;
        const stopProgress = idx / Math.max(simStopPoints.length - 1, 1);
        if (simProgress >= stopProgress - 0.01 && idx > 0 && idx < simStopPoints.length - 1) {
            simStoppedIndexes.push(idx);
            simIsPlaying = false;
            if (simAnimationId) {
                cancelAnimationFrame(simAnimationId);
                simAnimationId = null;
            }
            if (simStopTimer) {
                clearTimeout(simStopTimer);
                simStopTimer = null;
            }
            clearSimArrivalBanners();
            const banner = document.createElement("div");
            banner.className = "sim3d-arrival-banner";
            banner.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(15,23,42,0.95);color:#fff;padding:20px 32px;border-radius:16px;font-size:1.2rem;font-weight:800;z-index:99999;text-align:center;border:2px solid #4f8cff;box-shadow:0 8px 32px rgba(79,140,255,0.4);max-width:320px;";

            const titleEl = document.createElement("div");
            titleEl.textContent = `📍 ${stop.label || ''} に到着！`;

            const descEl = document.createElement("div");
            descEl.style.cssText = "font-size:0.9rem;font-weight:400;opacity:0.9;margin-top:6px;";
            descEl.textContent = stop.description || '';

            const subEl = document.createElement("div");
            subEl.style.cssText = "font-size:0.8rem;font-weight:400;opacity:0.6;margin-top:8px;";
            subEl.textContent = "3秒後に再出発します";

            banner.appendChild(titleEl);
            banner.appendChild(descEl);
            banner.appendChild(subEl);
            document.body.appendChild(banner);
            simStopTimer = setTimeout(function() {
                banner.remove();
                simStopTimer = null;
                if (simOverlayEl && !simOverlayEl.classList.contains("hidden")) {
                    simIsPlaying = true;
                    animateStep._lastTimestamp = null;
                    simAnimationId = requestAnimationFrame(animateStep);
                }
            }, 3000);
        }
    });
    if (simProgress >= 1) {
        simProgress = 1;
        simIsPlaying = false;
    }
    const point = getPathPointAndHeading(simPathCoords, simProgress);
    if (simCurrentHeading === null || isNaN(simCurrentHeading)) {
        simCurrentHeading = point.heading;
    } else {
        const diff = ((point.heading - simCurrentHeading + 540) % 360) - 180;
        simCurrentHeading = (simCurrentHeading + diff * 0.2 + 360) % 360;
    }
    const passedPath = [];
    const targetDist = simProgress * (simPathCoords._totalDist || 0);
    passedPath.push(simPathCoords[0]);
    for (let i = 1; i < simPathCoords.length; i++) {
        if (simPathCoords._distances && simPathCoords._distances[i] <= targetDist) {
            passedPath.push(simPathCoords[i]);
        } else {
            break;
        }
    }
    passedPath.push({ lat: point.lat, lng: point.lng });
    if (simProgressPolyline && typeof simProgressPolyline.setPath === "function") {
        try {
            simProgressPolyline.setPath(passedPath);
        } catch (e) {}
    }
    if (simMap) {
        try {
            if (typeof simMap.moveCamera === "function") {
                simMap.moveCamera({
                    center: { lat: point.lat, lng: point.lng },
                    heading: simCurrentHeading,
                    tilt: 60,
                    zoom: 17
                });
            } else if (typeof simMap.setCenter === "function") {
                simMap.setCenter({ lat: point.lat, lng: point.lng });
                if (typeof simMap.setHeading === "function") simMap.setHeading(simCurrentHeading);
                if (typeof simMap.setTilt === "function") simMap.setTilt(60);
                if (typeof simMap.setZoom === "function") simMap.setZoom(17);
            } else {
                const groundAlt = typeof point.alt === "number" && !isNaN(point.alt) ? point.alt : 40;
                simMap.center = { lat: point.lat, lng: point.lng, altitude: Math.max(40, groundAlt + 40) };
                simMap.heading = simCurrentHeading;
                simMap.tilt = 60;
                simMap.range = 1800;
            }
        } catch (e) {}
        if (simVehicleMarker) {
            try {
                simVehicleMarker.position = { lat: point.lat, lng: point.lng };
            } catch (e) {}
        }
    }
    let baseRealisticSpeed;
    if (totalDistKm < 5) {
        baseRealisticSpeed = 40;
    } else if (totalDistKm < 50) {
        baseRealisticSpeed = 40 + ((totalDistKm - 5) / 45) * 20;
    } else {
        const ratio = Math.min(1, (totalDistKm - 50) / 250);
        baseRealisticSpeed = 200 + ratio * 85;
    }

    const wobble = 1 + (Math.sin(simProgress * Math.PI * 8 + timestamp * 0.002) * 0.05);
    let displaySpeed = baseRealisticSpeed * wobble * simSpeed;
    displaySpeed = Math.min(300, Math.max(0, displaySpeed));

    const traveledDistance = simTotalDistance * simProgress;
    const traveledKm = traveledDistance / 1000;
    const estimatedSeconds = baseRealisticSpeed > 0 ? (traveledKm / baseRealisticSpeed) * 3600 : 0;

    simUpdateHUD({
        speed: displaySpeed,
        distance: traveledDistance,
        estimatedTime: estimatedSeconds,
        elapsed: elapsed,
        progress: simProgress
    });
    if (simProgress < 1) {
        simAnimationId = requestAnimationFrame(animateStep);
    } else {
        animateStep._lastTimestamp = null;
        const playBtn = document.getElementById("simPlayBtn");
        if (playBtn) {
            playBtn.querySelector(".material-icons").textContent = "replay";
        }
    }
}

async function resolveLocationCoords(locQuery) {
    if (!locQuery) return null;
    if (typeof locQuery === "object" && typeof locQuery.lat === "number" && typeof locQuery.lng === "number") {
        return { lat: locQuery.lat, lng: locQuery.lng, name: locQuery.name || "" };
    }
    if (typeof locQuery === "object" && locQuery.lat && (locQuery.lng || locQuery.lon)) {
        return {
            lat: parseFloat(locQuery.lat),
            lng: parseFloat(locQuery.lng || locQuery.lon),
            name: locQuery.name || locQuery.destination || ""
        };
    }
    const queryStr = String(locQuery).trim();
    if (!queryStr) return null;

    try {
        const { Geocoder } = await google.maps.importLibrary("geocoding");
        const geocoder = new Geocoder();
        const geoResult = await new Promise((resolve) => {
            geocoder.geocode({ address: queryStr, region: "JP" }, (results, status) => {
                if (status === "OK" && results && results[0] && results[0].geometry && results[0].geometry.location) {
                    resolve({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng(),
                        name: queryStr
                    });
                } else {
                    resolve(null);
                }
            });
        });
        if (geoResult) return geoResult;
    } catch (e) {}

    try {
        const { Place } = await google.maps.importLibrary("places");
        if (Place && typeof Place.searchByText === "function") {
            const placeRes = await Place.searchByText({
                textQuery: queryStr,
                fields: ["location", "displayName"]
            });
            if (placeRes && placeRes.places && placeRes.places[0] && placeRes.places[0].location) {
                const loc = placeRes.places[0].location;
                return {
                    lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
                    lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
                    name: queryStr
                };
            }
        }
    } catch (e) {}

    return null;
}

export async function open3DRouteSimulation(plan) {
    if (simAnimationId) {
        cancelAnimationFrame(simAnimationId);
        simAnimationId = null;
    }
    renderSimOverlay();
    simOverlayEl.classList.remove("hidden");
    document.body.classList.add("sim3d-open");
    document.body.style.overflow = "hidden";
    window.isDemoLocked = true;
    if (typeof window.enableDemoLock === "function") {
        window.enableDemoLock();
    }
    simProgress = 0;
    simIsPlaying = false;
    simStartTime = null;
    simCurrentHeading = null;
    simCurrentZoom = 18;
    simCurrentTilt = 65;
    simSpeed = 1.0;
    const sliderEl = document.getElementById("simSpeedSlider");
    if (sliderEl) sliderEl.value = "1";

    if (simRoutePolyline) {
        if (typeof simRoutePolyline.setMap === "function") simRoutePolyline.setMap(null);
        else if (typeof simRoutePolyline.remove === "function") simRoutePolyline.remove();
        simRoutePolyline = null;
    }
    if (simProgressPolyline) {
        if (typeof simProgressPolyline.setMap === "function") simProgressPolyline.setMap(null);
        else if (typeof simProgressPolyline.remove === "function") simProgressPolyline.remove();
        simProgressPolyline = null;
    }
    if (simStartMarker) {
        if (typeof simStartMarker.setMap === "function") simStartMarker.setMap(null);
        else if (typeof simStartMarker.remove === "function") simStartMarker.remove();
        simStartMarker = null;
    }
    if (simEndMarker) {
        if (typeof simEndMarker.setMap === "function") simEndMarker.setMap(null);
        else if (typeof simEndMarker.remove === "function") simEndMarker.remove();
        simEndMarker = null;
    }
    if (simVehicleMarker) {
        if ("map" in simVehicleMarker) simVehicleMarker.map = null;
        if (typeof simVehicleMarker.remove === "function") simVehicleMarker.remove();
        simVehicleMarker = null;
    }
    simWaypointMarkers.forEach(function (m) {
        if (m && typeof m.setMap === "function") m.setMap(null);
        else if (m && typeof m.remove === "function") m.remove();
    });
    simWaypointMarkers = [];
    if (simStopTimer) {
        clearTimeout(simStopTimer);
        simStopTimer = null;
    }
    clearSimArrivalBanners();

    const destName = plan.destination || "Destination";
    simUpdateHUD({
        speed: 0,
        distance: 0,
        elapsed: 0,
        progress: 0,
        destination: destName
    });

    await loadGoogleMaps();

    let waypoints = [];
    if (Array.isArray(plan.waypoints) && plan.waypoints.length >= 2) {
        waypoints = plan.waypoints.map((wp, idx) => ({
            lat: parseFloat(wp.lat),
            lng: parseFloat(wp.lng != null ? wp.lng : wp.lon),
            name: wp.name || wp.label || (idx === 0 ? "出発地" : idx === plan.waypoints.length - 1 ? (plan.destination || "目的地") : ("経由地" + idx)),
            label: idx === 0 ? "出発地" : idx === plan.waypoints.length - 1 ? (plan.destination || "目的地") : (wp.name || wp.label || ("経由地" + idx)),
            description: wp.description || ""
        })).filter(wp => !isNaN(wp.lat) && !isNaN(wp.lng));
    }

    if (waypoints.length < 2) {
        const departureQuery = plan.departure || (document.getElementById("planStartStation") ? document.getElementById("planStartStation").value : "") || "東京駅";
        const destinationQuery = plan.destination || (document.getElementById("planTargetName") ? document.getElementById("planTargetName").textContent : "") || "神戸三宮";

        let depPoint = null;
        if (plan.waypoints && plan.waypoints[0] && !isNaN(parseFloat(plan.waypoints[0].lat))) {
            depPoint = {
                lat: parseFloat(plan.waypoints[0].lat),
                lng: parseFloat(plan.waypoints[0].lng != null ? plan.waypoints[0].lng : plan.waypoints[0].lon),
                name: plan.waypoints[0].name || departureQuery
            };
        } else {
            depPoint = await resolveLocationCoords(departureQuery);
        }
        if (!depPoint) {
            depPoint = { lat: 34.7267, lng: 135.2768, name: departureQuery };
        }

        let destPoint = null;
        if (plan.lat && (plan.lon || plan.lng)) {
            destPoint = {
                lat: parseFloat(plan.lat),
                lng: parseFloat(plan.lon || plan.lng),
                name: destinationQuery
            };
        } else if (plan.waypoints && plan.waypoints.length > 0 && !isNaN(parseFloat(plan.waypoints[plan.waypoints.length - 1].lat))) {
            const lastWp = plan.waypoints[plan.waypoints.length - 1];
            destPoint = {
                lat: parseFloat(lastWp.lat),
                lng: parseFloat(lastWp.lng != null ? lastWp.lng : lastWp.lon),
                name: lastWp.name || destinationQuery
            };
        } else {
            destPoint = await resolveLocationCoords(destinationQuery);
        }
        if (!destPoint) {
            destPoint = { lat: 34.6901, lng: 135.1955, name: destinationQuery };
        }

        waypoints = [
            { lat: depPoint.lat, lng: depPoint.lng, name: departureQuery, label: "出発地", description: "旅のスタート地点" },
            { lat: destPoint.lat, lng: destPoint.lng, name: destinationQuery, label: plan.destination || "目的地", description: "旅の目的地" }
        ];
    }

    let detailedPath = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const fromPt = waypoints[i];
        const toPt = waypoints[i + 1];
        const startLat = fromPt.lat;
        const startLng = fromPt.lng;
        const endLat = toPt.lat;
        const endLng = toPt.lng;

        let segmentCoords = [];
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
            const response = await fetchWithSimTimeout(osrmUrl, {}, 4000);
            if (response.ok) {
                const data = await response.json();
                const coords = data && data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates;
                if (Array.isArray(coords) && coords.length > 0) {
                    segmentCoords = coords.map(function (c) {
                        return { lat: Number(c[1]), lng: Number(c[0]) };
                    });
                }
            }
        } catch (e) {
            segmentCoords = [];
        }

        if (segmentCoords.length === 0) {
            segmentCoords = generateFallbackLatLngPath(startLat, startLng, endLat, endLng, 60);
        }

        if (detailedPath.length > 0 && segmentCoords.length > 0) {
            detailedPath = detailedPath.concat(segmentCoords.slice(1));
        } else {
            detailedPath = detailedPath.concat(segmentCoords);
        }
    }

    if (detailedPath.length === 0) {
        const steps = 60;
        for (let k = 0; k <= steps; k++) {
            const t = k / steps;
            detailedPath.push({
                lat: waypoints[0].lat + (waypoints[waypoints.length - 1].lat - waypoints[0].lat) * t,
                lng: waypoints[0].lng + (waypoints[waypoints.length - 1].lng - waypoints[0].lng) * t
            });
        }
    }

    await populateRouteElevations(detailedPath);

    simPathCoords = detailedPath;
    simPathCoords._totalDist = null;
    simPathCoords._distances = null;
    simTotalDistance = calculateTotalDistance(simPathCoords);

    simWaypointLabels = waypoints.map(s => s.label);
    simStopPoints = waypoints.slice(1).map(function(pt, i) {
        return {
            lat: pt.lat,
            lng: pt.lng,
            label: pt.label || pt.name || ("経由地" + (i + 1)),
            description: pt.description || ""
        };
    });
    simStoppedIndexes = [];
    simCurrentWaypoints = waypoints;
    simCurrentDetailedPath = detailedPath;

    await initSimMap(waypoints, detailedPath);
    bindSimControlEvents();
}

export async function toggleSimMapMode() {
    if (isTogglingSimMode) return;
    if (!simCurrentWaypoints || simCurrentWaypoints.length < 2 || !simCurrentDetailedPath || simCurrentDetailedPath.length === 0) {
        return;
    }
    isTogglingSimMode = true;
    const modeBtn = document.getElementById("simModeToggleBtn");
    if (modeBtn) modeBtn.disabled = true;
    const wasPlaying = simIsPlaying;
    if (simAnimationId) {
        cancelAnimationFrame(simAnimationId);
        simAnimationId = null;
    }
    if (simStopTimer) {
        clearTimeout(simStopTimer);
        simStopTimer = null;
    }
    clearSimArrivalBanners();
    simIsPlaying = false;
    simMapMode = simMapMode === "3d" ? "2d" : "3d";
    const modeLabel = document.getElementById("simModeToggleLabel");
    if (modeLabel) {
        modeLabel.textContent = simMapMode === "3d" ? "2D/ベクター切替" : "リアル3D切替";
    }
    simMap = null;
    try {
        await initSimMap(simCurrentWaypoints, simCurrentDetailedPath);
        bindSimControlEvents();
        if (wasPlaying) {
            start3DAnimation();
        }
    } finally {
        if (modeBtn) modeBtn.disabled = false;
        isTogglingSimMode = false;
    }
}

async function initSimMap(waypoints, detailedPath) {
    const container = document.getElementById("sim3dMapContainer");
    if (!container) return;

    const startPt = waypoints[0];
    const endPt = waypoints[waypoints.length - 1];
    const startLat = startPt.lat;
    const startLng = startPt.lng;
    const endLat = endPt.lat;
    const endLng = endPt.lng;
    const currentPos = simProgress > 0 && detailedPath.length > 0
        ? getPathPointAndHeading(detailedPath, simProgress)
        : { lat: startLat, lng: startLng, alt: (detailedPath[0] && detailedPath[0].alt) || 40, heading: 0 };

    let initialHeading = currentPos.heading || 0;
    if (simProgress === 0 && detailedPath && detailedPath.length >= 2) {
        let nextIdx = 1;
        while (nextIdx < detailedPath.length - 1 && detailedPath[nextIdx].lat === detailedPath[0].lat && detailedPath[nextIdx].lng === detailedPath[0].lng) {
            nextIdx++;
        }
        if (window.google?.maps?.geometry?.spherical?.computeHeading) {
            const p1 = new google.maps.LatLng(detailedPath[0].lat, detailedPath[0].lng);
            const p2 = new google.maps.LatLng(detailedPath[nextIdx].lat, detailedPath[nextIdx].lng);
            initialHeading = google.maps.geometry.spherical.computeHeading(p1, p2);
        } else {
            const y = Math.sin((detailedPath[nextIdx].lng - detailedPath[0].lng) * Math.PI / 180) * Math.cos(detailedPath[nextIdx].lat * Math.PI / 180);
            const x = Math.cos(detailedPath[0].lat * Math.PI / 180) * Math.sin(detailedPath[nextIdx].lat * Math.PI / 180) -
                      Math.sin(detailedPath[0].lat * Math.PI / 180) * Math.cos(detailedPath[nextIdx].lat * Math.PI / 180) * Math.cos((detailedPath[nextIdx].lng - detailedPath[0].lng) * Math.PI / 180);
            initialHeading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        }
    }
    simCurrentHeading = initialHeading;

    if (simMapMode === "3d") {
        try {
            const maps3dLib = await google.maps.importLibrary("maps3d");
            const Map3DElement = maps3dLib && maps3dLib.Map3DElement;
            const Polyline3DElement = maps3dLib && maps3dLib.Polyline3DElement;
            const Marker3DElement = maps3dLib && maps3dLib.Marker3DElement;
            const AltitudeMode = maps3dLib && maps3dLib.AltitudeMode;
            if (Map3DElement && Polyline3DElement) {
                const startGroundAlt = typeof currentPos.alt === "number" && !isNaN(currentPos.alt) ? currentPos.alt : 40;
                if (!simMap || typeof simMap.setCenter === "function") {
                    container.innerHTML = "";
                    simMap = new Map3DElement({
                        center: { lat: currentPos.lat, lng: currentPos.lng, altitude: Math.max(40, startGroundAlt + 40) },
                        tilt: 60,
                        range: 1800,
                        heading: initialHeading,
                        mode: "HYBRID"
                    });
                    simMap.style.width = "100%";
                    simMap.style.height = "100%";
                    container.appendChild(simMap);
                } else {
                    simMap.center = { lat: currentPos.lat, lng: currentPos.lng, altitude: Math.max(40, startGroundAlt + 40) };
                    simMap.tilt = 60;
                    simMap.range = 1800;
                    simMap.heading = initialHeading;
                }

                const clampMode = AltitudeMode && AltitudeMode.CLAMP_TO_GROUND ? AltitudeMode.CLAMP_TO_GROUND : "CLAMP_TO_GROUND";
                simRoutePolyline = new Polyline3DElement({
                    strokeColor: "#00f3ff",
                    strokeWidth: 8,
                    altitudeMode: clampMode,
                    drawsOccludedSegments: true
                });
                simRoutePolyline.setAttribute("altitude-mode", "CLAMP_TO_GROUND");
                simRoutePolyline.coordinates = detailedPath.map(function (p) {
                    return { lat: p.lat, lng: p.lng };
                });
                simMap.append(simRoutePolyline);
                simProgressPolyline = null;

                if (Marker3DElement) {
                    simStartMarker = new Marker3DElement({
                        position: { lat: startLat, lng: startLng },
                        altitudeMode: clampMode,
                        label: "出発地"
                    });
                    simStartMarker.setAttribute("altitude-mode", "CLAMP_TO_GROUND");
                    simMap.append(simStartMarker);

                    simEndMarker = new Marker3DElement({
                        position: { lat: endLat, lng: endLng },
                        altitudeMode: clampMode,
                        label: "目的地"
                    });
                    simEndMarker.setAttribute("altitude-mode", "CLAMP_TO_GROUND");
                    simMap.append(simEndMarker);

                    simVehicleMarker = new Marker3DElement({
                        position: { lat: currentPos.lat, lng: currentPos.lng },
                        altitudeMode: clampMode,
                        label: "🚄"
                    });
                    simVehicleMarker.setAttribute("altitude-mode", "CLAMP_TO_GROUND");
                    simMap.append(simVehicleMarker);
                }
                return;
            }
        } catch (e) {}
    }

    const { AdvancedMarkerElement: ame } = await google.maps.importLibrary("marker");
    AdvancedMarkerElement = ame;

    if (!simMap || typeof simMap.setCenter !== "function") {
        container.innerHTML = "";
        simMap = new google.maps.Map(container, {
            center: { lat: currentPos.lat, lng: currentPos.lng },
            zoom: 17,
            tilt: 60,
            heading: initialHeading,
            mapId: "762efe723963e54aa2efe1dd",
            renderingType: "VECTOR",
            mapTypeId: "roadmap",
            colorScheme: google.maps.ColorScheme.DARK,
            disableDefaultUI: true,
            gestureHandling: "greedy"
        });
    } else {
        simMap.moveCamera({
            center: { lat: currentPos.lat, lng: currentPos.lng },
            zoom: 17,
            tilt: 60,
            heading: initialHeading
        });
    }

    simRoutePolyline = new google.maps.Polyline({
        path: detailedPath,
        geodesic: true,
        strokeColor: "#1e293b",
        strokeOpacity: 0.7,
        strokeWeight: 6
    });
    simRoutePolyline.setMap(simMap);

    simProgressPolyline = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: "#00f3ff",
        strokeOpacity: 1.0,
        strokeWeight: 6
    });
    simProgressPolyline.setMap(simMap);

    simStartMarker = new google.maps.Marker({
        position: { lat: startLat, lng: startLng },
        icon: createCustomMarkerIcon("start"),
        title: "出発地",
        map: simMap
    });

    simEndMarker = new google.maps.Marker({
        position: { lat: endLat, lng: endLng },
        icon: createCustomMarkerIcon("goal"),
        title: "目的地",
        map: simMap
    });

    const shinkansenEl = document.createElement("div");
    shinkansenEl.style.fontSize = "32px";
    shinkansenEl.style.display = "flex";
    shinkansenEl.style.alignItems = "center";
    shinkansenEl.style.justifyContent = "center";
    shinkansenEl.style.width = "40px";
    shinkansenEl.style.height = "40px";
    shinkansenEl.style.background = "rgba(255, 255, 255, 0.9)";
    shinkansenEl.style.borderRadius = "50%";
    shinkansenEl.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.3)";
    shinkansenEl.style.border = "2px solid #00f3ff";
    shinkansenEl.innerText = "🚄";
    simVehicleMarker = new AdvancedMarkerElement({
        position: { lat: currentPos.lat, lng: currentPos.lng },
        map: simMap,
        content: shinkansenEl
    });

    simWaypointMarkers.forEach(m => {
        if (m && typeof m.setMap === "function") m.setMap(null);
    });
    simWaypointMarkers = [];
    const intermediateStops = waypoints.slice(1, waypoints.length - 1);
    intermediateStops.forEach(function (wp, i) {
        const label = wp.label || wp.name || ("経由地" + (i + 1));
        const category = getSpotCategory(label);
        const marker = new google.maps.Marker({
            position: { lat: wp.lat, lng: wp.lng },
            map: simMap,
            title: label,
            icon: createCustomMarkerIcon(category)
        });
        simWaypointMarkers.push(marker);
    });
}

function initSimMapFallback(startLat, startLng) {
    const container = document.getElementById("sim3dMapContainer");
    if (!container) return;
    container.innerHTML = `
        <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#94a3b8;text-align:center;padding:20px;">
            <span class="material-icons" style="font-size:3rem;margin-bottom:12px;color:var(--primary-color);">map</span>
            <div style="font-size:1.1rem;font-weight:700;color:#e2e8f0;margin-bottom:8px;">Fallback Mode</div>
            <div style="font-size:0.85rem;line-height:1.5;">Google Maps API is unavailable.<br>Animation is running with computed coordinates.</div>
        </div>
    `;
    simMap = null;
}

export function close3DRouteSimulation() {
    if (simAnimationId) {
        cancelAnimationFrame(simAnimationId);
        simAnimationId = null;
    }
    simIsPlaying = false;
    simProgress = 0;
    simStartTime = null;
    simCurrentHeading = null;
    simPathCoords = [];
    if (simRoutePolyline) {
        if (typeof simRoutePolyline.setMap === "function") simRoutePolyline.setMap(null);
        else if (typeof simRoutePolyline.remove === "function") simRoutePolyline.remove();
        simRoutePolyline = null;
    }
    if (simProgressPolyline) {
        if (typeof simProgressPolyline.setMap === "function") simProgressPolyline.setMap(null);
        else if (typeof simProgressPolyline.remove === "function") simProgressPolyline.remove();
        simProgressPolyline = null;
    }
    if (simStartMarker) {
        if (typeof simStartMarker.setMap === "function") simStartMarker.setMap(null);
        else if (typeof simStartMarker.remove === "function") simStartMarker.remove();
        simStartMarker = null;
    }
    if (simEndMarker) {
        if (typeof simEndMarker.setMap === "function") simEndMarker.setMap(null);
        else if (typeof simEndMarker.remove === "function") simEndMarker.remove();
        simEndMarker = null;
    }
    if (simVehicleMarker) {
        if ("map" in simVehicleMarker) simVehicleMarker.map = null;
        if (typeof simVehicleMarker.remove === "function") simVehicleMarker.remove();
        simVehicleMarker = null;
    }

    simWaypointMarkers.forEach(function (m) {
        if (m && typeof m.setMap === "function") m.setMap(null);
        else if (m && typeof m.remove === "function") m.remove();
    });
    simWaypointMarkers = [];
    simWaypointLabels = [];
    if (simStopTimer) { clearTimeout(simStopTimer); simStopTimer = null; }
    clearSimArrivalBanners();
    simStopPoints = [];
    simStoppedIndexes = [];
    if (simOverlayEl) {
        simOverlayEl.classList.add("hidden");
    }
    document.body.classList.remove("sim3d-open");
    document.body.style.overflow = "";
}

export function start3DAnimation() {
    if (simPathCoords.length === 0) return;
    if (simAnimationId) {
        cancelAnimationFrame(simAnimationId);
        simAnimationId = null;
    }
    if (simStopTimer) {
        clearTimeout(simStopTimer);
        simStopTimer = null;
    }
    clearSimArrivalBanners();
    if (simProgress >= 1) {
        simProgress = 0;
        simStartTime = null;
        simStoppedIndexes = [];
    }
    simIsPlaying = true;
    simLastRenderTime = 0;
    animateStep._lastTimestamp = null;
    const playBtn = document.getElementById("simPlayBtn");
    if (playBtn) {
        const iconEl = playBtn.querySelector(".material-icons");
        if (iconEl) iconEl.textContent = "play_arrow";
    }
    simAnimationId = requestAnimationFrame(animateStep);
}

export function pause3DAnimation() {
    simIsPlaying = false;
    animateStep._lastTimestamp = null;
    if (simAnimationId) {
        cancelAnimationFrame(simAnimationId);
        simAnimationId = null;
    }
    if (simStopTimer) {
        clearTimeout(simStopTimer);
        simStopTimer = null;
    }
    clearSimArrivalBanners();
}

export function reset3DAnimation() {
    pause3DAnimation();
    clearSimArrivalBanners();
    simProgress = 0;
    simStartTime = null;
    simCurrentHeading = null;
    simStoppedIndexes = [];
    simCurrentZoom = 17;
    simCurrentTilt = 60;
    if (simProgressPolyline && typeof simProgressPolyline.setPath === "function") {
        try {
            simProgressPolyline.setPath([]);
        } catch (e) {}
    }
    simUpdateHUD({
        speed: 0,
        distance: 0,
        elapsed: 0,
        progress: 0
    });
    if (simMap && simPathCoords.length > 0) {
        const start = simPathCoords[0];
        const startGroundAlt = typeof start.alt === "number" && !isNaN(start.alt) ? start.alt : 40;
        try {
            if (typeof simMap.moveCamera === "function") {
                simMap.moveCamera({
                    center: { lat: start.lat, lng: start.lng },
                    heading: 0,
                    tilt: 60,
                    zoom: 17
                });
            } else {
                simMap.center = { lat: start.lat, lng: start.lng, altitude: Math.max(40, startGroundAlt + 40) };
                simMap.heading = 0;
                simMap.tilt = 60;
                simMap.range = 1800;
            }
        } catch (e) {}
        if (simVehicleMarker) {
            try {
                simVehicleMarker.position = { lat: start.lat, lng: start.lng };
            } catch (e) {}
        }
    }

    animateStep._lastTimestamp = null;
    const playBtn = document.getElementById("simPlayBtn");
    if (playBtn) {
        const iconEl = playBtn.querySelector(".material-icons");
        if (iconEl) iconEl.textContent = "play_arrow";
    }
}

window.open3DRouteSimulation = open3DRouteSimulation;
window.close3DRouteSimulation = close3DRouteSimulation;
window.start3DAnimation = start3DAnimation;
window.pause3DAnimation = pause3DAnimation;
window.reset3DAnimation = reset3DAnimation;
window.toggleSimMapMode = toggleSimMapMode;