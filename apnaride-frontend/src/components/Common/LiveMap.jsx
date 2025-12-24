import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistance } from '../../services/routingService';

// Fix Leaflet default icon — guarded to avoid deletion/TS issues
if (typeof L !== 'undefined' && L && L.Icon && L.Icon.Default && typeof L.Icon.Default.mergeOptions === 'function') {
    try {
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    } catch {
        // ignore merge errors in some environments (SSR / test runners)
    }
}

// Component to update map center
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function LiveMap({ 
    center = [28.6139, 77.2090], 
    zoom = 13, 
    markers = [], 
    route = null,
    height = '100%',
    onMapClick 
}) {
    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            style={{ height, width: '100%' }}
            onClick={onMapClick}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            <MapUpdater center={center} />
            
            {/* Render markers (drivers) with tooltip and distance */}
            
            {/* Render route if provided. If route has a 'coordinates' array use it. */}
            {route && ((Array.isArray(route) && route.length > 1) || (route.coordinates && route.coordinates.length > 1)) && (
                <Polyline 
                    positions={route.coordinates ? route.coordinates : route} 
                    color="#667eea" 
                    weight={4}
                    opacity={0.8}
                />
            )}

            {/* Render driver markers (markers prop expected to be array of { id, currentLat, currentLng, vehicleType, name }) */}
            {markers.map((marker, index) => {
                const position = [marker.currentLat ?? marker.lat, marker.currentLng ?? marker.lng];
                // compute distance to center if available
                const distKm = (center && position[0] != null) ? calculateDistance(center[0], center[1], position[0], position[1]) : null;

                return (
                    <Marker key={marker.id || index} position={position}>
                        <Popup>
                            <div>
                                <strong>{marker.name || 'Driver'}</strong>
                                <div style={{fontSize:12, color:'#444'}}>{(marker.vehicleType || 'Unknown').toUpperCase()}</div>
                                {distKm !== null && <div style={{fontSize:12, color:'#666'}}>{distKm.toFixed(2)} km away</div>}
                            </div>
                        </Popup>
                        <Tooltip direction="top" offset={[0,-12]}>
                            <div style={{fontWeight:700}}>{marker.vehicleType ? marker.vehicleType : 'Driver'}</div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
