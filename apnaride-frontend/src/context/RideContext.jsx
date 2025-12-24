import React, { createContext, useState, useContext, useEffect } from 'react';

const RideContext = createContext();

export function useRide() {
    const context = useContext(RideContext);
    if (!context) {
        throw new Error('useRide must be used within RideProvider');
    }
    return context;
}

export function RideProvider({ children }) {
    const [currentRide, setCurrentRide] = useState(null);
    const [rideStatus, setRideStatus] = useState('IDLE'); // IDLE, REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED
    const [driver, setDriver] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropLocation, setDropLocation] = useState(null);
    const [fare, setFare] = useState(null);

    // Load ride from localStorage on mount
    useEffect(() => {
        const savedRide = localStorage.getItem('currentRide');
        if (savedRide) {
            try {
                const ride = JSON.parse(savedRide);
                setCurrentRide(ride);
                setRideStatus(ride.status || 'IDLE');
            } catch (error) {
                console.error('Error loading saved ride:', error);
            }
        }
    }, []);

    // Save ride to localStorage whenever it changes
    useEffect(() => {
        if (currentRide) {
            localStorage.setItem('currentRide', JSON.stringify(currentRide));
        } else {
            localStorage.removeItem('currentRide');
        }
    }, [currentRide]);

    const startRide = (rideData) => {
        setCurrentRide(rideData);
        setRideStatus('REQUESTED');
        setPickupLocation(rideData.pickupLocation);
        setDropLocation(rideData.dropLocation);
        setFare(rideData.fare);
    };

    const acceptRide = (driverData) => {
        setDriver(driverData);
        setRideStatus('ACCEPTED');
        if (currentRide) {
            setCurrentRide({ ...currentRide, status: 'ACCEPTED', driver: driverData });
        }
    };

    const startTrip = () => {
        setRideStatus('IN_PROGRESS');
        if (currentRide) {
            setCurrentRide({ ...currentRide, status: 'IN_PROGRESS' });
        }
    };

    const completeRide = () => {
        setRideStatus('COMPLETED');
        if (currentRide) {
            setCurrentRide({ ...currentRide, status: 'COMPLETED' });
        }
    };

    const cancelRide = () => {
        setCurrentRide(null);
        setRideStatus('IDLE');
        setDriver(null);
        setCustomer(null);
        setPickupLocation(null);
        setDropLocation(null);
        setFare(null);
        localStorage.removeItem('currentRide');
    };

    const updateRideStatus = (status) => {
        setRideStatus(status);
        if (currentRide) {
            setCurrentRide({ ...currentRide, status });
        }
    };

    const value = {
        currentRide,
        rideStatus,
        driver,
        customer,
        pickupLocation,
        dropLocation,
        fare,
        startRide,
        acceptRide,
        startTrip,
        completeRide,
        cancelRide,
        updateRideStatus,
        setDriver,
        setCustomer
    };

    return (
        <RideContext.Provider value={value}>
            {children}
        </RideContext.Provider>
    );
}
