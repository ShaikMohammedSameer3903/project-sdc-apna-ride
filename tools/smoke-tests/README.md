# Smoke tests

Simple Node-based smoke test to exercise booking -> accept -> verify-otp -> start flows against your API.

Prerequisites:
- Node 16+ installed (or use the repo's node version manager)
- API server running locally and reachable at `API_BASE` (default: http://localhost:9031/api)

Usage:

```bash
# install dependencies once
cd tools/smoke-tests
npm install

# run (replace ids)
node smoke-test.js --api http://localhost:9031/api --riderId 123 --driverId 456
```

Environment variables supported:
- API_BASE
- RIDER_ID
- DRIVER_ID
- OTP (optional)

The script is intentionally small and tolerant: it logs responses and exits non-zero on critical failures (book/accept)."}