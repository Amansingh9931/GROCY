package com.grocecart.tracking;

import com.corundumstudio.socketio.SocketIOServer;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Live order tracking, port of socketServer.js. Same events as before, so the frontend's
 * socket.io-client code is untouched:
 *   joinOrderRoom(orderId)            customer/agent joins the order's room
 *   deliveryLocation({orderId,lat,lng}) agent -> room receives locationUpdate({lat,lng})
 *   stopTracking(orderId)             room receives trackingStopped, sender leaves
 * Rooms are cleaned up automatically on disconnect.
 */
@Configuration
public class SocketConfig {
    private static final Logger log = LoggerFactory.getLogger(SocketConfig.class);

    private static boolean truthy(Object o) {
        if (o == null) return false;
        if (o instanceof Number n) return n.doubleValue() != 0;
        if (o instanceof String s) return !s.isEmpty();
        return true;
    }

    @Bean(destroyMethod = "stop")
    public SocketIOServer socketIOServer(@Value("${socket.port:9092}") int port) {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(port);
        SocketIOServer server = new SocketIOServer(config);

        server.addConnectListener(c -> log.info("Socket connected: {}", c.getSessionId()));
        server.addDisconnectListener(c -> log.info("Socket disconnected: {}", c.getSessionId()));

        server.addEventListener("joinOrderRoom", String.class, (client, orderId, ack) -> {
            if (orderId == null || orderId.isBlank()) return;
            client.joinRoom(orderId);
            log.info("Socket {} joined order room {}", client.getSessionId(), orderId);
        });

        server.addEventListener("deliveryLocation", Map.class, (client, data, ack) -> {
            Object orderId = data.get("orderId"), lat = data.get("lat"), lng = data.get("lng");
            if (!truthy(orderId) || !truthy(lat) || !truthy(lng)) return;
            server.getRoomOperations(String.valueOf(orderId))
                    .sendEvent("locationUpdate", Map.of("lat", lat, "lng", lng));
        });

        server.addEventListener("stopTracking", String.class, (client, orderId, ack) -> {
            if (orderId == null || orderId.isBlank()) return;
            server.getRoomOperations(orderId).sendEvent("trackingStopped");
            client.leaveRoom(orderId);
        });

        server.start();
        log.info("Socket.IO server listening on :{}", port);
        return server;
    }
}
