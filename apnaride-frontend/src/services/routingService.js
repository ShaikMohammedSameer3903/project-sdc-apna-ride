// Advanced Routing Service with OSRM (Free routing API)
// Provides turn-by-turn directions and route optimization

// Try multiple OSRM endpoints to reduce occasional outages.
// You can override with VITE_OSRM_BASE (e.g., your own OSRM server base URL ending with "/route/v1/driving").
const ENV_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OSRM_BASE) || null;
const OSRM_ENDPOINTS = (
    ENV_BASE ? [ENV_BASE] : [
        'https://router.project-osrm.org/route/v1/driving',
        'https://routing.openstreetmap.de/routed-car/route/v1/driving'
    ]
);

// Backend proxy endpoint (preferred) to avoid browser CORS/rate limits
const PROXY_ENDPOINT = '/api/route';

// Simple in-flight de-duplication to prevent spamming endpoints from rapid re-renders
const inflight = new Map(); // key -> Promise

function keyFor(start, end) {
    // round to 5 decimals to avoid cache miss from tiny changes
    const r = (n) => Math.round(n * 1e5) / 1e5;
    return `${r(start[0])},${r(start[1])}|${r(end[0])},${r(end[1])}`;
}

/**
 * Get route between two points using OSRM (free routing service)
 * @param {Array} start - [lat, lng]
 * @param {Array} end - [lat, lng]
 * @returns {Promise} Route data with polyline and instructions
 */
export async function getRoute(start, end) {
    const k = keyFor(start, end);
    if (inflight.has(k)) return inflight.get(k);

    const p = (async () => {
        // 1) Try backend proxy first (reduces CORS/rate limit issues)
        try {
            const u = new URL(PROXY_ENDPOINT, window.location.origin);
            u.searchParams.set('startLat', start[0]);
            u.searchParams.set('startLng', start[1]);
            u.searchParams.set('endLat', end[0]);
            u.searchParams.set('endLng', end[1]);
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(u.toString(), { cache: 'no-store', signal: controller.signal });
            clearTimeout(t);
            if (res.ok) {
                let data = await res.json().catch(async () => {
                    // Some backends may return text; try to parse
                    const txt = await res.text();
                    return JSON.parse(txt);
                });
                if (data?.code === 'Ok' && data?.routes?.length) {
                    const route = data.routes[0];
                    return {
                        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
                        distance: route.distance,
                        duration: route.duration,
                        steps: (route.legs?.[0]?.steps || []).map(step => ({
                            instruction: step.maneuver?.type,
                            distance: step.distance,
                            duration: step.duration,
                            name: step.name || 'Unnamed road'
                        }))
                    };
                }
            }
        } catch (e) {
            console.warn('Proxy routing failed, trying public OSRM endpoints:', e.message || e);
        }

        // 2) Try public endpoints sequentially with a small backoff between attempts per endpoint
        for (const base of OSRM_ENDPOINTS) {
            try {
                const url = `${base}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), 6000); // 6s timeout
                const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
                clearTimeout(t);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                    throw new Error('No route found');
                }
                const route = data.routes[0];
                return {
                    coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
                    distance: route.distance,
                    duration: route.duration,
                    steps: (route.legs?.[0]?.steps || []).map(step => ({
                        instruction: step.maneuver?.type,
                        distance: step.distance,
                        duration: step.duration,
                        name: step.name || 'Unnamed road'
                    }))
                };
            } catch (e) {
                console.warn('OSRM endpoint failed, trying next:', base, e.message || e);
                // brief backoff before next endpoint to ease pressure
                await new Promise(r => setTimeout(r, 200));
            }
        }
        console.error('All routing endpoints failed; falling back to straight line');
        return {
            coordinates: [start, end],
            distance: calculateDistance(start, end) * 1000,
            duration: 0,
            steps: []
        };
    })()
    .finally(() => {
        // Keep result cached for 1s to dedupe burst requests
        setTimeout(() => inflight.delete(k), 1000);
    });

    inflight.set(k, p);
    return p;
}

/**
 * Calculate distance between two points (Haversine formula)
 * Supports both signatures:
 *  - calculateDistance([lat,lng], [lat,lng])
 *  - calculateDistance(lat1, lng1, lat2, lng2)
 * Returns distance in kilometers
 */
export function calculateDistance(a, b, c, d) {
    let lat1, lon1, lat2, lon2;
    if (Array.isArray(a) && Array.isArray(b)) {
        [lat1, lon1] = a;
        [lat2, lon2] = b;
    } else {
        lat1 = a; lon1 = b; lat2 = c; lon2 = d;
    }

    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const A = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
    return R * C;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Smooth animation between two positions
 * @param {Array} start - [lat, lng]
 * @param {Array} end - [lat, lng]
 * @param {number} duration - Animation duration in ms
 * @param {Function} callback - Called with interpolated position
 */
export function animateMarker(start, end, duration, callback) {
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth movement
        const eased = easeInOutCubic(progress);
        
        const lat = start[0] + (end[0] - start[0]) * eased;
        const lng = start[1] + (end[1] - start[1]) * eased;
        
        callback([lat, lng]);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Format duration to human-readable string
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
    if (seconds < 60) {
        return `${Math.round(seconds)} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format distance to human-readable string
 * @param {number} meters
 * @returns {string}
 */
export function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}
