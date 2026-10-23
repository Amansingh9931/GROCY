package com.grocecart.common;

import java.util.Map;

public class ApiException extends RuntimeException {
    private final int status;
    private final transient Map<String, Object> body;

    public ApiException(int status, Map<String, Object> body) {
        super(String.valueOf(body.get("message")));
        this.status = status;
        this.body = body;
    }

    /** Body shape {message} (used by the original user Auth middleware / user controller). */
    public static ApiException of(int status, String message) {
        return new ApiException(status, Js.map("message", message));
    }

    /** Body shape {success:false, message}. */
    public static ApiException fail(int status, String message) {
        return new ApiException(status, Js.map("success", false, "message", message));
    }

    public int getStatus() { return status; }
    public Map<String, Object> getBody() { return body; }
}
