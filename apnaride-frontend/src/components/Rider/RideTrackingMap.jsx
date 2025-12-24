import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
if (typeof L !== 'undefined' && L && L.Icon && L.Icon.Default) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
}

const RideTrackingMap = ({ 
    pickup, 
    dropoff, 
    driverLocation, 
    onRouteFound,
    height = '500px'
}) => {
    const [route, setRoute] = useState(null);
    
    useEffect(() => {
        if (!pickup || !dropoff) return;
        
        const map = L.map('map');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add markers
        const pickupMarker = L.marker([pickup.lat, pickup.lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map);
        
        const dropoffMarker = L.marker([dropoff.lat, dropoff.lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map);
        
        // Add routing control
        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(pickup.lat, pickup.lng),
                L.latLng(dropoff.lat, dropoff.lng)
            ],
            routeWhileDragging: true,
            show: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            createMarker: () => false // Disable default markers
        }).addTo(map);
        
        // Handle route found
        routingControl.on('routesfound', (e) => {
            const routes = e.routes;
            if (routes && routes[0]) {
                const routeData = {
                    distance: routes[0].summary.totalDistance / 1000, // in km
                    duration: Math.ceil(routes[0].summary.totalTime / 60), // in minutes
                    coordinates: routes[0].coordinates.map(coord => [coord.lat, coord.lng])
                };
                setRoute(routeData);
                if (onRouteFound) onRouteFound(routeData);
            }
        });
        
        // Fit map to bounds
        const bounds = L.latLngBounds([
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
        
        // Cleanup
        return () => {
            map.remove();
        };
    }, [pickup, dropoff]);
    
    return (
        <div id="map" style={{ height, width: '100%', borderRadius: '8px' }} />
    );
};

export default RideTrackingMap;
