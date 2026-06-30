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
let simCurrentTilt = 65;
let simStartMarker = null;
let simEndMarker = null;
let simWaypointMarkers = [];
let simWaypointLabels = [];
let simVehicleMarker = null;
let simStopPoints = [];
let simStoppedIndexes = [];
let simStopTimer = null;

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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker`;
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
        simSpeed = parseFloat(e.target.value) / 3;
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
    const delta = (timestamp - (animateStep._lastTimestamp || timestamp)) / 1000;
    animateStep._lastTimestamp = timestamp;
    let baseSpeed = 40;
    if (simTotalDistance / 40 > 180) {
        baseSpeed = simTotalDistance / 180;
    }
    const currentSpeed = baseSpeed * simSpeed;
    const totalDist = Math.max(1, simTotalDistance);
    simProgress += (currentSpeed * delta) / totalDist;
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
            const banner = document.createElement("div");
            banner.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(15,23,42,0.95);color:#fff;padding:20px 32px;border-radius:16px;font-size:1.2rem;font-weight:800;z-index:99999;text-align:center;border:2px solid #4f8cff;box-shadow:0 8px 32px rgba(79,140,255,0.4);max-width:320px;";
            banner.innerHTML = "📍 " + stop.label + " に到着！<br><span style='font-size:0.9rem;font-weight:400;opacity:0.9;margin-top:6px;display:block;'>" + stop.description + "</span><span style='font-size:0.8rem;font-weight:400;opacity:0.6;margin-top:8px;display:block;'>3秒後に再出発します</span>";
            document.body.appendChild(banner);
            simStopTimer = setTimeout(function() {
                banner.remove();
                simIsPlaying = true;
                simAnimationId = requestAnimationFrame(animateStep);
            }, 3000);
        }
    });
    if (simProgress >= 1) {
        simProgress = 1;
        simIsPlaying = false;
    }
    const point = getPathPointAndHeading(simPathCoords, simProgress);
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
    if (simProgressPolyline) {
        simProgressPolyline.setPath(passedPath);
    }
    if (simMap) {
        simMap.moveCamera({
            center: { lat: point.lat, lng: point.lng },
            heading: 0,
            tilt: 65,
            zoom: 17
        });
        if (simVehicleMarker) {
            simVehicleMarker.setPosition({ lat: point.lat, lng: point.lng });
        }
    }
    const simulatedSpeed = baseSpeed * simSpeed + Math.sin(simProgress * Math.PI * 4) * 5;
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
    simCurrentZoom = 17;
    simCurrentTilt = 65;
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
    simWaypointLabels = plan.waypointLabels || [];
    simStopPoints = (plan.waypoints || []).map(function(wp, i) {
        return {
            lat: parseFloat(wp.lat),
            lng: parseFloat(wp.lng),
            label: wp.name || (plan.waypointLabels || [])[i] || ("経由地" + i),
            description: wp.description || ""
        };
    });
    simStoppedIndexes = [];
    initSimMap(startLat, startLng, endLat, endLng, intermediates);
}

function initSimMap(startLat, startLng, endLat, endLng, intermediates) {
    const container = document.getElementById("sim3dMapContainer");
    if (!container) return;
    if (!simMap) {
        simMap = new google.maps.Map(container, {
            center: { lat: startLat, lng: startLng },
            zoom: 17,
            tilt: 65,
            heading: 0,
            mapId: "762efe723963e54aa2efe1dd",
            mapTypeId: "hybrid",
            colorScheme: google.maps.ColorScheme.DARK,
            disableDefaultUI: true,
            gestureHandling: "greedy"
        });
    }
    simRoutePolyline = new google.maps.Polyline({
        path: simPathCoords,
        geodesic: true,
        strokeColor: "#1e293b",
        strokeOpacity: 0.6,
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
    simVehicleMarker = new google.maps.Marker({
        position: { lat: startLat, lng: startLng },
        map: simMap
    });
    simWaypointMarkers = [];
    if (Array.isArray(intermediates)) {
        intermediates.forEach(function (wp, i) {
            const label = simWaypointLabels[i + 1] || ("経由地" + (i + 1));
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
    if (simProgressPolyline) {
        simProgressPolyline.setMap(null);
        simProgressPolyline = null;
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
    simWaypointMarkers.forEach(function (m) { m.setMap(null); });
    simWaypointMarkers = [];
    simWaypointLabels = [];
    if (simStopTimer) { clearTimeout(simStopTimer); simStopTimer = null; }
    simStopPoints = [];
    simStoppedIndexes = [];
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
    simCurrentZoom = 17;
    simCurrentTilt = 65;
    if (simProgressPolyline) {
        simProgressPolyline.setPath([]);
    }
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