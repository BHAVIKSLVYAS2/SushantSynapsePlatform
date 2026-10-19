package com.sushantsynapse.platform;

public class NavigationPolicyTest {
    private static void check(boolean result) { if (!result) throw new AssertionError(); }
    public static void main(String[] args) {
        for (String url : new String[]{"https://apps.sushantsynapse.com/", "https://apps.sushantsynapse.com:443/advocate?organisation=1", "https://APPS.SUSHANTSYNAPSE.COM/account"}) check(NavigationPolicy.internal(url));
        for (String url : new String[]{"http://apps.sushantsynapse.com/", "https://apps.sushantsynapse.com.evil.test/", "https://apps.sushantsynapse.com@evil.test/", "https://evil.test@apps.sushantsynapse.com/", "https://apps.sushantsynapse.com:444/", "javascript:alert(1)", "file:///private", "content://private", "intent://example", "https://apps.sushantsynapse.com\\@evil.test", "not a url"}) check(!NavigationPolicy.internal(url));
        for (String url : new String[]{"https://wa.me/123", "mailto:hello@example.test", "tel:123", "whatsapp://send?text=hello"}) check(NavigationPolicy.external(url));
        for (String url : new String[]{"intent://arbitrary", "javascript:alert(1)", "file:///private", "content://private", "data:text/html,test"}) check(!NavigationPolicy.external(url));
        check(NavigationPolicy.filename("../private/file.pdf").equals("_private_file.pdf"));
        check(NavigationPolicy.filename("...").equals("download"));
        check(NavigationPolicy.filename("certificate.pdf").equals("certificate.pdf"));
        System.out.println("Navigation policy: 26 checks passed");
    }
}
