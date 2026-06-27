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
let simStartMarker = null;
let simEndMarker = null;
let simVehicleMarker = null;

function getApiUrl(path) {
    const base = (window.location.port && window.location.port !== "3000")
        ? "http://localhost:3000"
        : window.location.origin;
    return `${base}${path}`;
}

export function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject) => {
        if (simGoogleMapsLoaded && window.google && window.google.maps) {
            resolve();
            return;
        }
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            const check = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(check);
                    simGoogleMapsLoaded = true;
                    resolve();
                }
            }, 100);
            return;
        }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            simGoogleMapsLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error("Google Maps API loading failed"));
        document.head.appendChild(script);
    });
}

export async function fetchRoutesData(originLat, originLng, destLat, destLng, intermediates = []) {
    try {
        const url = getApiUrl("/api/travel/routes");
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                origin: { lat: originLat, lng: originLng },
                destination: { lat: destLat, lng: destLng },
                intermediates: intermediates
            })
        });
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
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ textQuery: query })
        });
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
            const d = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
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

    const p1 = new google.maps.LatLng(currentPoint.lat, currentPoint.lng);
    const p2 = new google.maps.LatLng(nextPoint.lat, nextPoint.lng);

    const interpPoint = google.maps.geometry.spherical.interpolate(p1, p2, fraction);
    let heading = google.maps.geometry.spherical.computeHeading(p1, p2);

    if (currentPoint.lat === nextPoint.lat && currentPoint.lng === nextPoint.lng) {
        heading = getPathPointAndHeading._lastHeading || 0;
    } else {
        getPathPointAndHeading._lastHeading = heading;
    }

    return { lat: interpPoint.lat(), lng: interpPoint.lng(), heading: heading };
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
    if (timeEl && data.elapsed !== undefined) {
        const mins = Math.floor(data.elapsed / 60);
        const secs = Math.floor(data.elapsed % 60);
        timeEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    if (progEl && data.progress !== undefined) {
        progEl.style.width = `${Math.round(data.progress * 100)}%`;
    }
    if (destEl && data.destination !== undefined) {
        destEl.textContent = data.destination;
    }
}

function renderSimOverlay() {
    if (document.getElementById("sim3dOverlay")) {
        simOverlayEl = document.getElementById("sim3dOverlay");
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
            <button class="sim3d-close-btn" id="simCloseBtn">
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
            <button class="sim3d-ctrl-btn" id="simResetBtn" title="Reset">
                <span class="material-icons">replay</span>
            </button>
            <button class="sim3d-ctrl-btn sim3d-ctrl-play" id="simPlayBtn" title="Start">
                <span class="material-icons">play_arrow</span>
            </button>
            <button class="sim3d-ctrl-btn" id="simPauseBtn" title="Pause">
                <span class="material-icons">pause</span>
            </button>
            <div class="sim3d-speed-control">
                <label class="sim3d-speed-label">Speed</label>
                <input type="range" id="simSpeedSlider" min="1" max="10" value="3" class="sim3d-speed-slider">
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    simOverlayEl = overlay;

    document.getElementById("simCloseBtn").addEventListener("click", () => {
        close3DRouteSimulation();
    });
    document.getElementById("simPlayBtn").addEventListener("click", () => {
        start3DAnimation();
    });
    document.getElementById("simPauseBtn").addEventListener("click", () => {
        pause3DAnimation();
    });
    document.getElementById("simResetBtn").addEventListener("click", () => {
        reset3DAnimation();
    });
    document.getElementById("simSpeedSlider").addEventListener("input", (e) => {
        simSpeed = 0.5 + (parseFloat(e.target.value) - 1) * (1.0 / 9);
    });
}

function animateStep(timestamp) {
    if (!simIsPlaying) return;
    const frameDuration = 1000 / 30;
    if (timestamp - simLastRenderTime < frameDuration) {
        simAnimationId = requestAnimationFrame(animateStep);
        return;
    }
    simLastRenderTime = timestamp;
    if (!simStartTime) simStartTime = timestamp;
    const elapsed = (timestamp - simStartTime) / 1000;
    const baseDuration = 180;
    const delta = (timestamp - (animateStep._lastTimestamp || timestamp)) / 1000;
    animateStep._lastTimestamp = timestamp;
    simProgress += (delta / baseDuration) * simSpeed;
    if (simProgress >= 1) {
        simProgress = 1;
        simIsPlaying = false;
    }
    const point = getPathPointAndHeading(simPathCoords, simProgress);
    if (simCurrentHeading === null) {
        simCurrentHeading = point.heading;
    } else {
        let diff = point.heading - simCurrentHeading;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        simCurrentHeading += diff * 0.15;
    }
    if (simMap) {
        simMap.moveCamera({
            center: { lat: point.lat, lng: point.lng },
            heading: simCurrentHeading,
            tilt: 65,
            zoom: 17
        });
        if (simVehicleMarker) {
            simVehicleMarker.setPosition({ lat: point.lat, lng: point.lng });
            const currentColor = simVehicleMarker.getIcon().fillColor;
            simVehicleMarker.setIcon({
                path: "M -20,5 L 10,5 C 18,5 23,3 25,0 C 27,-3 26,-6 20,-6 L -20,-6 Z M -15,-4 L -9,-4 L -9,-2 L -15,-2 Z M -5,-4 L 1,-4 L 1,-2 L -5,-2 Z M 5,-4 L 12,-4 L 10,-2 L 5,-2 Z",
                fillColor: currentColor,
                fillOpacity: 1,
                strokeColor: "#1D4ED8",
                strokeWeight: 1,
                scale: 1.2,
                anchor: new google.maps.Point(0, 0),
                rotation: point.heading - 180
            });
        }
    }
    const simulatedSpeed = 40 + Math.sin(simProgress * Math.PI * 4) * 20;
    const traveledDistance = simTotalDistance * simProgress;
    simUpdateHUD({
        speed: simulatedSpeed,
        distance: traveledDistance,
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

export async function open3DRouteSimulation(plan) {
    renderSimOverlay();
    simOverlayEl.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    simProgress = 0;
    simIsPlaying = false;
    simStartTime = null;
    simCurrentHeading = null;
    const destName = plan.destination || "Destination";
    simUpdateHUD({
        speed: 0,
        distance: 0,
        elapsed: 0,
        progress: 0,
        destination: destName
    });
    let startLat = 34.6937;
    let startLng = 135.5023;
    let endLat = parseFloat(plan.lat) || 34.9949;
    let endLng = parseFloat(plan.lon) || 135.7850;
    let intermediates = [];
    if (plan.waypoints && plan.waypoints.length >= 2) {
        const wp = plan.waypoints;
        startLat = parseFloat(wp[0].lat);
        startLng = parseFloat(wp[0].lng);
        endLat = parseFloat(wp[wp.length - 1].lat);
        endLng = parseFloat(wp[wp.length - 1].lng);
        intermediates = wp.slice(1, wp.length - 1).map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));
    }
    try {
        await loadGoogleMaps("AIzaSyB3NKrrdzg7yCnn_ATcmWs-r5j4Z5PDcBg");
    } catch (e) {
        simPathCoords = generateFallbackLatLngPath(startLat, startLng, endLat, endLng, 100);
        simTotalDistance = calculateTotalDistance(simPathCoords);
        initSimMapFallback(startLat, startLng);
        return;
    }
    const routeData = await fetchRoutesData(startLat, startLng, endLat, endLng, intermediates);
    if (routeData && routeData.path) {
        simPathCoords = routeData.path;
    } else {
        simPathCoords = generateFallbackLatLngPath(startLat, startLng, endLat, endLng, 100);
    }
    simTotalDistance = calculateTotalDistance(simPathCoords);
    initSimMap(startLat, startLng, endLat, endLng);
}

function initSimMap(startLat, startLng, endLat, endLng) {
    const container = document.getElementById("sim3dMapContainer");
    if (!container) return;
    if (!simMap) {
        simMap = new google.maps.Map(container, {
            center: { lat: startLat, lng: startLng },
            zoom: 17,
            tilt: 65,
            heading: 0,
            mapId: "762efe723963e54aa2efe1dd",
            colorScheme: google.maps.ColorScheme.DARK,
            disableDefaultUI: true,
            gestureHandling: "greedy"
        });
    }
    simRoutePolyline = new google.maps.Polyline({
        path: simPathCoords,
        geodesic: true,
        strokeColor: "#4f8cff",
        strokeOpacity: 0.9,
        strokeWeight: 5
    });
    simRoutePolyline.setMap(simMap);
    simStartMarker = new google.maps.Marker({
        position: { lat: startLat, lng: startLng },
        label: "S"
    });
    simStartMarker.setMap(simMap);
    simEndMarker = new google.maps.Marker({
        position: { lat: endLat, lng: endLng },
        label: "G"
    });
    simEndMarker.setMap(simMap);
    const trainColor = Math.random() < 0.1 ? "#FFD700" : "#FFFFFF";
    simVehicleMarker = new google.maps.Marker({
        position: { lat: startLat, lng: startLng },
        icon: {
            path: "M -20,5 L 10,5 C 18,5 23,3 25,0 C 27,-3 26,-6 20,-6 L -20,-6 Z M -15,-4 L -9,-4 L -9,-2 L -15,-2 Z M -5,-4 L 1,-4 L 1,-2 L -5,-2 Z M 5,-4 L 12,-4 L 10,-2 L 5,-2 Z",
            fillColor: trainColor,
            fillOpacity: 1,
            strokeColor: "#1D4ED8",
            strokeWeight: 1,
            scale: 1.2,
            anchor: new google.maps.Point(3, -0.5),
            rotation: 0
        }
    });
    simVehicleMarker.setMap(simMap);
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
        simRoutePolyline.setMap(null);
        simRoutePolyline = null;
    }
    if (simStartMarker) {
        simStartMarker.setMap(null);
        simStartMarker = null;
    }
    if (simEndMarker) {
        simEndMarker.setMap(null);
        simEndMarker = null;
    }
    if (simVehicleMarker) {
        simVehicleMarker.setMap(null);
        simVehicleMarker = null;
    }
    if (simOverlayEl) {
        simOverlayEl.classList.add("hidden");
    }
    document.body.style.overflow = "";
}

export function start3DAnimation() {
    if (simPathCoords.length === 0) return;
    if (simProgress >= 1) {
        simProgress = 0;
        simStartTime = null;
    }
    simIsPlaying = true;
    const playBtn = document.getElementById("simPlayBtn");
    if (playBtn) {
        playBtn.querySelector(".material-icons").textContent = "play_arrow";
    }
    simAnimationId = requestAnimationFrame(animateStep);
}

export function pause3DAnimation() {
    simIsPlaying = false;
    if (simAnimationId) {
        cancelAnimationFrame(simAnimationId);
        simAnimationId = null;
    }
}

export function reset3DAnimation() {
    pause3DAnimation();
    simProgress = 0;
    simStartTime = null;
    simCurrentHeading = null;
    simUpdateHUD({
        speed: 0,
        distance: 0,
        elapsed: 0,
        progress: 0
    });
    if (simMap && simPathCoords.length > 0) {
        const start = simPathCoords[0];
        simMap.moveCamera({
            center: { lat: start.lat, lng: start.lng },
            heading: 0,
            tilt: 65,
            zoom: 17
        });
    }
    animateStep._lastTimestamp = null;
    const playBtn = document.getElementById("simPlayBtn");
    if (playBtn) {
        playBtn.querySelector(".material-icons").textContent = "play_arrow";
    }
}