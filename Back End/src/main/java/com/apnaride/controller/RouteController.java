package com.apnaride.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api/route")
@CrossOrigin(origins = "*")
public class RouteController {

    // You can override OSRM base via env (e.g., application properties -> OSRM_BASE)
    private static final String ENV_BASE = System.getenv("OSRM_BASE");

    private static final List<String> OSRM_ENDPOINTS = ENV_BASE != null && !ENV_BASE.isBlank()
            ? List.of(ENV_BASE)
            : List.of(
                "https://router.project-osrm.org/route/v1/driving",
                "https://routing.openstreetmap.de/routed-car/route/v1/driving"
            );

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @GetMapping
    public ResponseEntity<?> route(
            @RequestParam("startLat") double startLat,
            @RequestParam("startLng") double startLng,
            @RequestParam("endLat") double endLat,
            @RequestParam("endLng") double endLng
    ) {
        for (String base : OSRM_ENDPOINTS) {
            try {
                String url = String.format(Locale.US,
                        "%s/%f,%f;%f,%f?overview=full&geometries=geojson&steps=true",
                        base, startLng, startLat, endLng, endLat);
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(6))
                        .GET()
                        .build();
                HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() >= 200 && res.statusCode() < 300) {
                    // pass-through OSRM JSON; frontend knows how to parse geojson
                    return ResponseEntity.ok(res.body());
                }
            } catch (Exception ignore) {
                // try next
            }
        }
        // Fallback straight line when all endpoints fail
        Map<String, Object> geometry = new HashMap<>();
        geometry.put("type", "LineString");
        List<List<Double>> coords = List.of(
                List.of(startLng, startLat),
                List.of(endLng, endLat)
        );
        geometry.put("coordinates", coords);
        Map<String, Object> route0 = new HashMap<>();
        route0.put("geometry", geometry);
        route0.put("distance", haversine(startLat, startLng, endLat, endLng) * 1000);
        route0.put("duration", 0);
        Map<String, Object> payload = new HashMap<>();
        payload.put("code", "Ok");
        payload.put("routes", List.of(route0));
        payload.put("waypoints", Collections.emptyList());
        return ResponseEntity.status(HttpStatus.OK).body(payload);
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}
