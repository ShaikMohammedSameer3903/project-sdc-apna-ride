// Free geocoding service using OpenStreetMap Nominatim API
const NOMINATIM_BASE_URL = '/nominatim';

// Simple in-memory caches to speed up repeated lookups
const searchCache = new Map(); // key: query string -> result
const reverseCache = new Map(); // key: `${lat},${lng}` -> result

export const geocodeAddress = async (address) => {
    try {
        const key = address.trim().toLowerCase();
        if (searchCache.has(key)) return searchCache.get(key);

        const response = await fetch(
            `${NOMINATIM_BASE_URL}/search?` + new URLSearchParams({
                q: address,
                format: 'json',
                addressdetails: 1,
                limit: 1,
                countrycodes: 'in' // Restrict to India
            }),
            {
                headers: {
                    'User-Agent': 'ApnaRide/1.0',
                    'Accept-Language': 'en-IN'
                }
            }
        );

        const data = await response.json();
        
        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name,
                address: data[0].address
            };
            searchCache.set(key, result);
            return result;
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
};

export const reverseGeocode = async (lat, lng) => {
    try {
        const key = `${lat},${lng}`;
        if (reverseCache.has(key)) return reverseCache.get(key);

        const response = await fetch(
            `${NOMINATIM_BASE_URL}/reverse?` + new URLSearchParams({
                lat: lat.toString(),
                lon: lng.toString(),
                format: 'json',
                addressdetails: 1
            }),
            {
                headers: {
                    'User-Agent': 'ApnaRide/1.0',
                    'Accept-Language': 'en-IN'
                }
            }
        );

        const data = await response.json();
        
        if (data && data.display_name) {
            const result = {
                displayName: data.display_name,
                address: data.address
            };
            reverseCache.set(key, result);
            return result;
        }
        
        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
};

// Get current location using browser geolocation API
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        const tryOnce = (options, onFail) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    if (onFail) onFail(error); else reject(error);
                },
                options
            );
        };

        // First attempt: moderate settings
        tryOnce(
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
            (err) => {
                // Retry once with longer timeout
                if (err && typeof err === 'object' && 'code' in err && err.code === 3) {
                    tryOnce({ enableHighAccuracy: false, timeout: 30000, maximumAge: 120000 });
                } else {
                    reject(err);
                }
            }
        );
    });
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Major Indian cities with coordinates for quick selection
export const majorIndianCities = [
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Thane', lat: 19.2183, lng: 72.9781 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Pimpri-Chinchwad', lat: 18.6298, lng: 73.7997 },
    { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
    { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
    { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
    { name: 'Meerut', lat: 28.9845, lng: 77.7064 },
    { name: 'Rajkot', lat: 22.3039, lng: 70.8022 },
    { name: 'Kalyan-Dombivali', lat: 19.2403, lng: 73.1305 },
    { name: 'Vasai-Virar', lat: 19.4612, lng: 72.7985 },
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739 }
];
