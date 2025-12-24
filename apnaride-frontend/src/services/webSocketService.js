import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.connecting = false;
        this.subscriptions = {};
        this.pendingSubs = [];
    }

    connect(onConnected, onError) {
        if (this.connected || this.connecting) {
            if (this.connected && onConnected) onConnected();
            return;
        }

        this.connecting = true;
        // Resolve WS base: prefer env; fallback to same-origin '/ws'
        const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_BASE) ? import.meta.env.VITE_WS_BASE : null;
        const sockUrl = envBase ? (envBase.endsWith('/ws') ? envBase : `${envBase}/ws`) : '/ws';
        // Use factory to enable auto-reconnect per stompjs recommendation
        this.stompClient = Stomp.over(() => new SockJS(sockUrl));
        // Optional: tune reconnect delay
        this.stompClient.reconnectDelay = 5000;

        this.stompClient.connect(
            {},
            (frame) => {
                console.log('WebSocket Connected:', frame);
                this.connected = true;
                this.connecting = false;
                // flush any pending subscriptions
                try {
                    this.pendingSubs.forEach(({ dest, cb, key }) => {
                        const sub = this.stompClient.subscribe(dest, (message) => {
                            const data = JSON.parse(message.body);
                            cb(data);
                        });
                        if (key) this.subscriptions[key] = sub;
                    });
                } finally {
                    this.pendingSubs = [];
                }
                if (onConnected) onConnected();
            },
            (error) => {
                console.error('WebSocket Error:', error);
                this.connected = false;
                this.connecting = false;
                if (onError) onError(error);
            }
        );
    }

    disconnect() {
        if (this.stompClient && this.connected) {
            this.stompClient.disconnect();
            this.connected = false;
            console.log('WebSocket Disconnected');
        }
    }

    // Subscribe to ride updates for a specific user
    subscribeToRideUpdates(userId, callback) {
        const dest = `/topic/ride-updates/${userId}`;
        const key = `ride-${userId}`;
        if (!this.connected) {
            console.warn('WebSocket not connected yet, queuing subscription', dest);
            this.pendingSubs.push({ dest, cb: callback, key });
            return null;
        }

        const subscription = this.stompClient.subscribe(dest, (message) => {
            const data = JSON.parse(message.body);
            callback(data);
        });

        this.subscriptions[key] = subscription;
        return subscription;
    }

    // Subscribe to driver location updates
    subscribeToDriverLocation(driverId, callback) {
        const dest = `/topic/driver-location/${driverId}`;
        const key = `driver-${driverId}`;
        if (!this.connected) {
            console.warn('WebSocket not connected yet, queuing subscription', dest);
            this.pendingSubs.push({ dest, cb: callback, key });
            return null;
        }

        const subscription = this.stompClient.subscribe(dest, (message) => {
            const data = JSON.parse(message.body);
            callback(data);
        });

        this.subscriptions[key] = subscription;
        return subscription;
    }

    // Subscribe to new ride requests (for drivers)
    subscribeToRideRequests(driverId, callback) {
        const dest = `/queue/ride-requests/${driverId}`;
        const key = `requests-${driverId}`;
        if (!this.connected) {
            console.warn('WebSocket not connected yet, queuing subscription', dest);
            this.pendingSubs.push({ dest, cb: callback, key });
            return null;
        }

        const subscription = this.stompClient.subscribe(dest, (message) => {
            const data = JSON.parse(message.body);
            callback(data);
        });

        this.subscriptions[key] = subscription;
        return subscription;
    }

    // Subscribe to chat messages for a specific ride
    subscribeToChat(rideId, callback) {
        if (!this.connected) {
            console.error('WebSocket not connected');
            return null;
        }

        const subscription = this.stompClient.subscribe(
            `/topic/chat/${rideId}`,
            (message) => {
                try {
                    const data = JSON.parse(message.body);
                    callback(data);
                } catch (e) {
                    console.warn('Failed to parse chat message', e);
                }
            }
        );

        this.subscriptions[`chat-${rideId}`] = subscription;
        return subscription;
    }

    // Send driver location update
    sendLocationUpdate(driverId, location) {
        if (!this.connected) {
            console.error('WebSocket not connected');
            return;
        }

        this.stompClient.send(
            '/app/driver-location',
            {},
            JSON.stringify({
                driverId,
                latitude: location.lat,
                longitude: location.lng,
                heading: location.heading,
                speed: location.speed
            })
        );
    }

    // Send chat message
    sendChatMessage(rideId, senderId, message) {
        if (!this.connected) {
            console.error('WebSocket not connected');
            return;
        }

        this.stompClient.send(
            '/app/chat',
            {},
            JSON.stringify({
                rideId,
                senderId,
                message,
                timestamp: new Date().toISOString()
            })
        );
    }

    // Unsubscribe from a specific topic
    unsubscribe(subscriptionKey) {
        if (this.subscriptions[subscriptionKey]) {
            this.subscriptions[subscriptionKey].unsubscribe();
            delete this.subscriptions[subscriptionKey];
        }
    }

    // Unsubscribe from all topics
    unsubscribeAll() {
        Object.keys(this.subscriptions).forEach(key => {
            this.subscriptions[key].unsubscribe();
        });
        this.subscriptions = {};
    }

    isConnected() {
        return this.connected;
    }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
