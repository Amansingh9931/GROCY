package com.grocecart.common;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(e.getBody());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleOther(Exception e) {
        if (e instanceof ErrorResponse er) { // Spring MVC errors keep their own status (404, 405, 400...)
            return ResponseEntity.status(er.getStatusCode())
                    .body(Js.map("success", false, "message", String.valueOf(e.getMessage())));
        }
        log.error("Unhandled error", e);
        return ResponseEntity.status(500)
                .body(Js.map("success", false, "message", e.getMessage() == null ? "Internal server error" : e.getMessage()));
    }
}
