package com.grocecart.common;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/** Small helpers that reproduce the JavaScript semantics the original Express code relied on. */
public final class Js {
    private static final Pattern OBJECT_ID = Pattern.compile("^[0-9a-fA-F]{24}$");

    private Js() {}

    public static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) m.put(String.valueOf(kv[i]), kv[i + 1]);
        return m;
    }

    public static Map<String, Object> body(Map<String, Object> b) {
        return b == null ? new LinkedHashMap<>() : b;
    }

    public static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    /** JS truthiness: null, "", 0, false are falsy. */
    public static boolean truthy(Object o) {
        if (o == null) return false;
        if (o instanceof String s) return !s.isEmpty();
        if (o instanceof Boolean b) return b;
        if (o instanceof Number n) return n.doubleValue() != 0;
        return true;
    }

    public static double num(Object o, double fallback) {
        if (o instanceof Number n) return n.doubleValue();
        if (o instanceof String s) {
            try { return Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return fallback; }
        }
        return fallback;
    }

    public static boolean isObjectId(String s) {
        return s != null && OBJECT_ID.matcher(s).matches();
    }

    /** Parses jsonwebtoken-style durations such as "7d", "12h", "3600". */
    public static long durationMillis(String text) {
        var m = Pattern.compile("^\\s*(\\d+)\\s*([smhdw]?)\\s*$").matcher(text == null ? "" : text);
        if (!m.matches()) return 7L * 24 * 3600 * 1000;
        long n = Long.parseLong(m.group(1));
        return switch (m.group(2)) {
            case "m" -> n * 60_000;
            case "h" -> n * 3_600_000;
            case "d" -> n * 86_400_000;
            case "w" -> n * 604_800_000;
            default -> n * 1000; // "s" or bare number = seconds
        };
    }
}
