package com.apnaride.controller;

import com.apnaride.dto.PaymentIntentRequest;
import com.apnaride.model.PaymentTransaction;
import com.apnaride.model.Ride;
import com.apnaride.repository.PaymentTransactionRepository;
import com.apnaride.repository.RideRepository;
import com.apnaride.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URL;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private RideRepository rideRepository;

    @PostMapping("/create-intent")
    public ResponseEntity<?> createIntent(@RequestBody PaymentIntentRequest request) {
        PaymentTransaction txn = paymentService.createPaymentIntent(request);
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("transactionId", txn.getTransactionId());
        body.put("amount", txn.getAmount());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        try {
            Number amtNum = (Number) (payload.getOrDefault("amount", 0));
            int amount = amtNum != null ? amtNum.intValue() : 0;
            String currency = String.valueOf(payload.getOrDefault("currency", "INR"));
            String receipt = String.valueOf(payload.getOrDefault("receipt", "rcpt_" + System.currentTimeMillis()));

            String keyId = System.getenv("RAZORPAY_KEY_ID");
            String keySecret = System.getenv("RAZORPAY_KEY_SECRET");

            // If keys are available, attempt real order creation; otherwise, return a mock order
            if (keyId != null && !keyId.isEmpty() && keySecret != null && !keySecret.isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    Map<String, Object> req = new HashMap<>();
                    req.put("amount", amount);
                    req.put("currency", currency);
                    req.put("receipt", receipt);
                    String json = mapper.writeValueAsString(req);

                    String auth = keyId + ":" + keySecret;
                    String basic = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

                    URL url = new URL("https://api.razorpay.com/v1/orders");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Authorization", "Basic " + basic);
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setDoOutput(true);
                    try (java.io.OutputStream os = conn.getOutputStream()) {
                        byte[] input = json.getBytes(StandardCharsets.UTF_8);
                        os.write(input, 0, input.length);
                    }
                    int status = conn.getResponseCode();
                    java.io.InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
                    java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(is, StandardCharsets.UTF_8));
                    StringBuilder respSb = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) { respSb.append(line); }
                    in.close();
                    String respBody = respSb.toString();
                    if (status >= 200 && status < 300) {
                        Map<?, ?> respMap = mapper.readValue(respBody, Map.class);
                        String orderId = String.valueOf(respMap.get("id"));
                        Map<String, Object> out = new HashMap<>();
                        out.put("success", true);
                        out.put("orderId", orderId);
                        out.put("amount", amount);
                        out.put("currency", currency);
                        return ResponseEntity.ok(out);
                    } else {
                        // Fall through to mock if Razorpay call fails
                    }
                } catch (Exception ex) {
                    // Fall back to mock order if real call fails
                }
            }

            Map<String, Object> mock = new HashMap<>();
            mock.put("success", true);
            mock.put("orderId", "order_" + System.currentTimeMillis());
            mock.put("amount", amount);
            mock.put("currency", currency);
            mock.put("mock", true);
            return ResponseEntity.ok(mock);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, Object> payload) {
        try {
            // Razorpay verification path
            if (payload.containsKey("razorpay_order_id") && payload.containsKey("razorpay_payment_id") && payload.containsKey("razorpay_signature")) {
                String orderId = String.valueOf(payload.get("razorpay_order_id"));
                String paymentId = String.valueOf(payload.get("razorpay_payment_id"));
                String signature = String.valueOf(payload.get("razorpay_signature"));

                String secret = System.getenv("RAZORPAY_KEY_SECRET");
                if (secret == null || secret.isBlank()) {
                    // No secret configured; accept for demo
                    return ResponseEntity.ok(Map.of("success", true, "verified", false, "warning", "Signature not verified (missing secret)"));
                }

                String data = orderId + "|" + paymentId;
                String computed = hmacSha256Hex(secret, data);
                boolean match = computed.equals(signature);
                if (!match) {
                    return ResponseEntity.status(400).body(Map.of("success", false, "error", "Invalid signature"));
                }
                // Optionally persist a transaction record here
                return ResponseEntity.ok(Map.of("success", true, "verified", true));
            }

            // Legacy verification path
            String txnId = (String) payload.getOrDefault("transactionId", "");
            Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByTransactionId(txnId);
            if (txnOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Transaction not found"));
            }
            PaymentTransaction updated = paymentService.processPayment(txnOpt.get().getId(), "Verified");
            return ResponseEntity.ok(Map.of("success", true, "status", updated.getStatus()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/cash")
    public ResponseEntity<?> cash(@RequestBody Map<String, Object> payload) {
        try {
            // rideId sent from frontend is bookingId string, so support both numeric and string
            Object rideIdObj = payload.get("rideId");
            Object amountObj = payload.get("amount");
            if (rideIdObj == null || amountObj == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "rideId and amount are required"));
            }

            String bookingId = String.valueOf(rideIdObj);
            Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
            if (rideOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Ride not found"));
            }

            Ride ride = rideOpt.get();

            // Record cash transaction
            PaymentTransaction txn = new PaymentTransaction();
            txn.setRideId(ride.getId());
            txn.setCustomerId(ride.getCustomerId());
            txn.setDriverId(ride.getRiderId());
            txn.setAmount(((Number) Double.valueOf(String.valueOf(amountObj))).doubleValue());
            txn.setCurrency("INR");
            txn.setPaymentMethod("CASH");
            txn.setTransactionId("CASH-" + bookingId);
            txn.setStatus("SUCCESS");
            txn.setCompletedAt(LocalDateTime.now());
            paymentTransactionRepository.save(txn);

            // Optionally mark ride as COMPLETED only if not already
            if (!"COMPLETED".equalsIgnoreCase(ride.getStatus())) {
                ride.setStatus("COMPLETED");
                ride.setCompletedAt(LocalDateTime.now());
                rideRepository.save(ride);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cash payment recorded",
                    "transactionId", txn.getTransactionId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/upi")
    public ResponseEntity<?> upi(@RequestBody Map<String, Object> payload) {
        // Placeholder that mirrors success for demo
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<?> history(@PathVariable Long userId) {
        List<PaymentTransaction> asCustomer = paymentTransactionRepository.findByCustomerId(userId);
        List<PaymentTransaction> asDriver = paymentTransactionRepository.findByDriverId(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "customer", asCustomer,
                "driver", asDriver
        ));
    }

    @PostMapping("/refund")
    public ResponseEntity<?> refund(@RequestBody Map<String, Object> payload) {
        String txnId = (String) payload.getOrDefault("transactionId", "");
        String reason = (String) payload.getOrDefault("reason", "");
        Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByTransactionId(txnId);
        if (txnOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "error", "Transaction not found"));
        }
        PaymentTransaction updated = paymentService.refundPayment(txnOpt.get().getId(), reason);
        return ResponseEntity.ok(Map.of("success", true, "status", updated.getStatus()));
    }

    private static String hmacSha256Hex(String secret, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(raw.length * 2);
        for (byte b : raw) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

}
