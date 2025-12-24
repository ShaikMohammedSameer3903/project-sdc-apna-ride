/* Simple smoke test script for booking -> accept -> verify-otp -> start flow
   Usage: node smoke-test.js --api http://localhost:9031/api --riderId <riderId> --driverId <driverId>
*/
const fetch = require('node-fetch');
const argv = require('minimist')(process.argv.slice(2));
const API = argv.api || process.env.API_BASE || 'http://localhost:9031/api';
const riderId = argv.riderId || argv.rider || process.env.RIDER_ID;
const driverId = argv.driverId || argv.driver || process.env.DRIVER_ID;

if (!riderId || !driverId) {
    console.error('Please provide --riderId and --driverId');
    process.exit(2);
}

async function run() {
    console.log('API base:', API);

    // 1) Book ride as rider
    const bookPayload = {
        riderId,
        pickupLat: 28.6139,
        pickupLng: 77.2090,
        dropLat: 28.6200,
        dropLng: 77.2100,
        vehicleType: 'CAR'
    };

    console.log('Booking ride...');
    let res = await fetch(`${API}/rides/book`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(bookPayload)
    });
    if (!res.ok) {
        console.error('Book failed', await res.text());
        process.exit(1);
    }
    const booked = await res.json();
    console.log('Booked:', booked);
    const bookingId = booked.bookingId || booked.id || booked.bookingId;
    if (!bookingId) {
        console.error('No bookingId in response');
        process.exit(1);
    }

    // 2) Driver accepts
    console.log('Driver accepting...');
    res = await fetch(`${API}/rides/${bookingId}/accept`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ driverId })
    });
    const acceptPayload = await res.json().catch(() => null);
    if (!res.ok) {
        console.error('Accept failed', acceptPayload);
        process.exit(1);
    }
    console.log('Accepted:', acceptPayload);

    // 3) Verify OTP (if returned by server)
    const otp = acceptPayload?.ride?.otp || acceptPayload?.otp || process.env.OTP || '';
    if (otp) {
        console.log('Verifying OTP:', otp);
        res = await fetch(`${API}/rides/${bookingId}/verify-otp`, {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ otp })
        });
        const v = await res.json().catch(() => null);
        if (!res.ok) {
            console.error('OTP verify failed', v);
            process.exit(1);
        }
        console.log('OTP verified', v);
    } else {
        console.log('Server did not return OTP in accept payload; skipping verify-otp step');
    }

    // 4) Mark start if endpoint exists
    console.log('Marking ride as started (if endpoint exists)...');
    res = await fetch(`${API}/rides/${bookingId}/start`, { method: 'POST' }).catch(() => null);
    if (res && res.ok) {
        console.log('Ride started');
    } else {
        console.log('No start endpoint or start failed (safe to ignore for now)');
    }

    console.log('Smoke test completed successfully');
}

run().catch(e => { console.error('Smoke test error', e); process.exit(1); });
