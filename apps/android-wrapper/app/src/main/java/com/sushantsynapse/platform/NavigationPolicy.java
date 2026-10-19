package com.sushantsynapse.platform;

import java.net.URI;

/** Shared policy: only the exact production HTTPS origin enters the app WebView. */
public final class NavigationPolicy {
    public static final String HOST = "apps.sushantsynapse.com";
    public static boolean internal(String value) {
        try {
            URI uri = new URI(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getHost())
                && uri.getRawUserInfo() == null && (uri.getPort() == -1 || uri.getPort() == 443);
        } catch (Exception ignored) { return false; }
    }
    public static boolean external(String value) {
        try {
            String scheme = new URI(value).getScheme();
            return scheme != null && (scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http")
                || scheme.equalsIgnoreCase("mailto") || scheme.equalsIgnoreCase("tel")
                || scheme.equalsIgnoreCase("whatsapp"));
        } catch (Exception ignored) { return false; }
    }
    public static String filename(String name) {
        String safe = name == null ? "download" : name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
        safe = safe.replaceAll("^\\.+", "").trim();
        return safe.isEmpty() ? "download" : safe.substring(0, Math.min(safe.length(), 120));
    }
    private NavigationPolicy() {}
}
