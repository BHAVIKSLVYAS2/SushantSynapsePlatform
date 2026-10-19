package com.sushantsynapse.platform;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.Settings;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebMessage;
import android.webkit.WebMessagePort;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int PICK_FILE = 10, SAVE_FILE = 11, MAX_DOWNLOAD = 32 * 1024 * 1024;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private WebView web;
    private LinearLayout errorPanel;
    private ScrollView errorScreen;
    private TextView errorTitle, errorMessage;
    private ProgressBar progress;
    private ConnectivityManager connectivity;
    private ConnectivityManager.NetworkCallback networkCallback;
    private ValueCallback<Uri[]> filePicker;
    private WebMessagePort port;
    private byte[] pendingDownload;
    private ByteArrayOutputStream incoming;
    private String incomingName, incomingMime;
    private String retryUrl = BuildConfig.SITE_URL;
    private boolean failedNavigation, loaded, pageFailed, saving, receiving;
    private int pageGeneration;
    private String bridgeScript;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (android.os.Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        try (InputStream in = getAssets().open("wrapper.js")) {
            ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] buffer = new byte[4096]; int n;
            while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
            bridgeScript = new String(out.toByteArray(), StandardCharsets.UTF_8);
        } catch (Exception e) { throw new IllegalStateException("Missing wrapper script", e); }
        connectivity = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        createUi();
        configureWebView();
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override public void onLost(Network network) { main.post(() -> updateConnectivity()); }
            @Override public void onCapabilitiesChanged(Network network, NetworkCapabilities caps) { main.post(() -> updateConnectivity()); }
        };
        connectivity.registerDefaultNetworkCallback(networkCallback);
        // Restore a URL only: never serialize private DOM, cookies or form fields into activity state.
        if (state != null && NavigationPolicy.internal(state.getString("page"))) retryUrl = state.getString("page");
        if (online()) web.loadUrl(retryUrl); else showError(R.string.offline_title, R.string.offline_message, true);
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private int color(int id) { return getColor(id); }
    private TextView text(String value, int size) {
        TextView v = new TextView(this); v.setText(value); v.setTextSize(size); v.setTextColor(color(R.color.text_primary)); return v;
    }
    private void createUi() {
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(color(R.color.surface));
        if (android.os.Build.VERSION.SDK_INT >= 30) root.setOnApplyWindowInsetsListener((v, insets) -> {
            android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            android.graphics.Insets keyboard = insets.getInsets(WindowInsets.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom)); return insets;
        });
        // API 26-29 use the decor's normal system-bar fitting instead of the API 30 inset API.
        LinearLayout toolbar = new LinearLayout(this); toolbar.setGravity(Gravity.CENTER_VERTICAL); toolbar.setPadding(dp(12), 0, dp(4), 0);
        ImageView logo = new ImageView(this); logo.setImageResource(R.drawable.company_logo); logo.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        toolbar.addView(logo, new LinearLayout.LayoutParams(dp(32), dp(32)));
        TextView title = text(getString(R.string.app_name), 15); title.setSingleLine(true); title.setEllipsize(android.text.TextUtils.TruncateAt.END); title.setPadding(dp(8), 0, 0, 0);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(48), 1)); title.setGravity(Gravity.CENTER_VERTICAL);
        Button menu = new Button(this); menu.setText("⋮"); menu.setContentDescription("Platform options");
        toolbar.addView(menu, new LinearLayout.LayoutParams(dp(52), dp(48))); menu.setOnClickListener(v -> showMenu(menu));
        root.addView(toolbar);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal); progress.setMax(100); root.addView(progress, new LinearLayout.LayoutParams(-1, dp(3)));
        FrameLayout content = new FrameLayout(this); root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1));
        web = new WebView(this); content.addView(web, new FrameLayout.LayoutParams(-1, -1));
        errorPanel = new LinearLayout(this); errorPanel.setOrientation(LinearLayout.VERTICAL); errorPanel.setGravity(Gravity.CENTER); errorPanel.setPadding(dp(28), dp(24), dp(28), dp(24)); errorPanel.setBackgroundColor(color(R.color.surface));
        ImageView errorLogo = new ImageView(this); errorLogo.setImageResource(R.drawable.company_logo); errorPanel.addView(errorLogo, new LinearLayout.LayoutParams(dp(88), dp(88)));
        errorTitle = text("", 24); errorTitle.setGravity(Gravity.CENTER); errorTitle.setPadding(0, dp(24), 0, dp(12)); if (android.os.Build.VERSION.SDK_INT >= 28) errorTitle.setAccessibilityHeading(true); errorPanel.addView(errorTitle);
        errorMessage = text("", 16); errorMessage.setTextColor(color(R.color.text_secondary)); errorMessage.setGravity(Gravity.CENTER); errorMessage.setPadding(0, 0, 0, dp(20)); errorPanel.addView(errorMessage);
        Button retry = new Button(this); retry.setText(R.string.retry); retry.setTextColor(color(R.color.on_accent)); retry.setBackgroundTintList(android.content.res.ColorStateList.valueOf(color(R.color.accent))); retry.setOnClickListener(v -> retry()); errorPanel.addView(retry, new LinearLayout.LayoutParams(-1, dp(52)));
        Button settings = new Button(this); settings.setText(R.string.network_settings); settings.setOnClickListener(v -> {
            try { startActivity(new Intent(Settings.ACTION_WIRELESS_SETTINGS)); } catch (ActivityNotFoundException ignored) { toast("Open Wi-Fi or mobile data in your device settings."); }
        }); errorPanel.addView(settings, new LinearLayout.LayoutParams(-1, dp(52)));
        errorScreen = new ScrollView(this); errorScreen.setFillViewport(true); errorScreen.setBackgroundColor(color(R.color.surface));
        errorScreen.addView(errorPanel, new ScrollView.LayoutParams(-1, -2));
        content.addView(errorScreen, new FrameLayout.LayoutParams(-1, -1)); errorScreen.setVisibility(View.GONE);
        setContentView(root);
    }

    @SuppressWarnings("SetJavaScriptEnabled") private void configureWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false); s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW); s.setSafeBrowsingEnabled(true);
        s.setJavaScriptCanOpenWindowsAutomatically(false); s.setSupportMultipleWindows(true);
        s.setUserAgentString(s.getUserAgentString() + " SynapseAndroid/" + BuildConfig.VERSION_NAME);
        CookieManager.getInstance().setAcceptCookie(true); CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (!request.isForMainFrame()) return !NavigationPolicy.internal(url) && !"about:blank".equals(url);
                if (NavigationPolicy.internal(url)) return false;
                if (request.hasGesture()) openExternal(url);
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
                pageGeneration++; pageFailed = false; closePort();
                if (NavigationPolicy.internal(url)) retryUrl = url;
                progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                if (!pageFailed && NavigationPolicy.internal(url)) {
                    loaded = true; failedNavigation = false;
                    if (online()) hideError();
                    attachBridge(); CookieManager.getInstance().flush();
                }
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                if ("GET".equals(request.getMethod()) && NavigationPolicy.internal(request.getUrl().toString())) retryUrl = request.getUrl().toString();
                else retryUrl = BuildConfig.SITE_URL;
                pageFailed = true;
                showError(online() ? R.string.server_title : R.string.offline_title, online() ? R.string.server_message : R.string.offline_message, true);
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) { pageFailed = true; showError(R.string.server_title, R.string.server_message, true); }
            }
            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel(); pageFailed = true; showError(R.string.secure_title, R.string.secure_message, true);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) { progress.setProgress(value); }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePicker != null) filePicker.onReceiveValue(null);
                filePicker = callback;
                try { startActivityForResult(params.createIntent(), PICK_FILE); }
                catch (ActivityNotFoundException e) { filePicker.onReceiveValue(null); filePicker = null; toast("No file picker is available on this device."); }
                return true;
            }
            @Override public boolean onCreateWindow(WebView view, boolean dialog, boolean gesture, Message result) {
                if (!gesture) return false;
                WebView popup = new WebView(MainActivity.this);
                popup.setWebViewClient(new WebViewClient() {
                    @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                        String url = request.getUrl().toString();
                        if (NavigationPolicy.internal(url)) web.loadUrl(url); else openExternal(url);
                        main.post(popup::destroy); return true;
                    }
                });
                ((WebView.WebViewTransport) result.obj).setWebView(popup); result.sendToTarget(); return true;
            }
        });
        web.setDownloadListener((url, agent, disposition, mime, length) -> {
            if (NavigationPolicy.internal(url)) downloadHttps(url, android.webkit.URLUtil.guessFileName(url, disposition, mime), mime);
            else toast("Use Open in browser from Platform options to download this file.");
        });
        if (android.os.Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::goBack);
    }

    private boolean online() {
        NetworkCapabilities c = connectivity.getNetworkCapabilities(connectivity.getActiveNetwork());
        return c != null && c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) && c.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }
    private void updateConnectivity() {
        if (!online()) showError(R.string.offline_title, R.string.offline_message, false);
        else if (errorScreen.getVisibility() == View.VISIBLE && !pageFailed) errorMessage.setText(R.string.connection_restored);
    }
    private void showError(int title, int message, boolean navigation) {
        failedNavigation |= navigation; errorTitle.setText(title); errorMessage.setText(message);
        errorScreen.setVisibility(View.VISIBLE); web.setVisibility(View.INVISIBLE); progress.setVisibility(View.GONE);
    }
    private void hideError() { errorScreen.setVisibility(View.GONE); web.setVisibility(View.VISIBLE); }
    private void retry() {
        if (!online()) { showError(R.string.offline_title, R.string.offline_message, false); return; }
        hideError();
        // An interrupted POST is never resubmitted; Retry navigates with GET only.
        if (!loaded || failedNavigation) web.loadUrl(NavigationPolicy.internal(retryUrl) ? retryUrl : BuildConfig.SITE_URL);
    }
    private void goBack() { if (web.canGoBack()) { hideError(); web.goBack(); } else finish(); }
    @Override public void onBackPressed() { goBack(); }
    private void showMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        for (String label : new String[]{"Home", "Reload page", "Print / Save PDF", "Open in browser", "About this app"}) menu.getMenu().add(label);
        menu.setOnMenuItemClickListener(item -> {
            switch (item.getTitle().toString()) {
                case "Home": retryUrl = BuildConfig.SITE_URL; failedNavigation = true; retry(); break;
                case "Reload page": if (online()) web.loadUrl(NavigationPolicy.internal(web.getUrl()) ? web.getUrl() : retryUrl); else updateConnectivity(); break;
                case "Print / Save PDF": printPage(); break;
                case "Open in browser": openExternal(NavigationPolicy.internal(web.getUrl()) ? web.getUrl() : BuildConfig.SITE_URL); break;
                default: new AlertDialog.Builder(this).setTitle(R.string.app_name).setMessage("Version " + BuildConfig.VERSION_NAME + "\n\nLoads the live website. Website updates appear automatically when a page is reopened. An internet connection is required.\n\nAndroid wrapper updates are installed separately.").setPositiveButton("OK", null).show();
            }
            return true;
        }); menu.show();
    }
    private void openExternal(String url) {
        if (!NavigationPolicy.external(url)) { toast("This link cannot be opened in the app."); return; }
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE)); }
        catch (ActivityNotFoundException e) { toast("No app is installed to open this link."); }
    }
    private void printPage() {
        if (!loaded || errorScreen.getVisibility() == View.VISIBLE) { toast("Open a page before printing."); return; }
        ((PrintManager) getSystemService(PRINT_SERVICE)).print(getString(R.string.app_name), web.createPrintDocumentAdapter("Sushant Synapse"), new PrintAttributes.Builder().build());
    }

    // A transferred MessagePort is delivered only to our exact HTTPS origin.
    // No addJavascriptInterface is exposed to arbitrary third-party iframes.
    private void attachBridge() {
        closePort(); WebMessagePort[] channels = web.createWebMessageChannel(); port = channels[0];
        int generation = pageGeneration;
        port.setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
            @Override public void onMessage(WebMessagePort p, WebMessage message) {
                if (generation != pageGeneration || !NavigationPolicy.internal(web.getUrl())) return;
                try { handleBridge(new JSONObject(message.getData())); } catch (Exception e) { incoming = null; receiving = false; toast("The download could not be saved. Try again."); }
            }
        });
        web.evaluateJavascript(bridgeScript, ignored -> {
            if (generation == pageGeneration && NavigationPolicy.internal(web.getUrl())) web.postWebMessage(new WebMessage("synapse-native-ready", new WebMessagePort[]{channels[1]}), Uri.parse(BuildConfig.SITE_URL));
        });
    }
    private void closePort() { if (port != null) { port.close(); port = null; } incoming = null; receiving = false; }
    private void handleBridge(JSONObject message) throws Exception {
        switch (message.getString("type")) {
            case "print": printPage(); break;
            case "error": incoming = null; receiving = false; toast("Unable to prepare the download. Try again or open this page in your browser."); break;
            case "start":
                if (saving || receiving) { toast("Finish the current download first."); return; }
                int size = message.getInt("size"); if (size < 0 || size > MAX_DOWNLOAD) throw new IllegalArgumentException();
                incoming = new ByteArrayOutputStream(); receiving = true; incomingName = NavigationPolicy.filename(message.optString("name", "download")); incomingMime = message.optString("mime", "application/octet-stream"); break;
            case "chunk":
                if (!receiving || incoming == null) return;
                String chunk = message.getString("data"); if (chunk.length() > 65536) throw new IllegalArgumentException();
                byte[] bytes = Base64.decode(chunk, Base64.DEFAULT); if (incoming.size() + bytes.length > MAX_DOWNLOAD) throw new IllegalArgumentException(); incoming.write(bytes); break;
            case "end":
                if (!receiving || incoming == null) return;
                byte[] data = incoming.toByteArray(); incoming = null; receiving = false; saveFile(data, incomingName, incomingMime); break;
        }
    }
    private void downloadHttps(String url, String name, String mime) {
        if (saving || receiving) { toast("Finish the current download first."); return; }
        saving = true; String cookies = CookieManager.getInstance().getCookie(url);
        io.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(url).openConnection(); connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(15000); connection.setReadTimeout(30000);
                if (cookies != null) connection.setRequestProperty("Cookie", cookies);
                if (connection.getResponseCode() != 200 || connection.getContentLengthLong() > MAX_DOWNLOAD) throw new IllegalStateException();
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                try (InputStream in = connection.getInputStream()) { byte[] buffer = new byte[16384]; int n; while ((n = in.read(buffer)) != -1) { if (out.size() + n > MAX_DOWNLOAD) throw new IllegalStateException(); out.write(buffer, 0, n); } }
                byte[] data = out.toByteArray(); main.post(() -> { saving = false; saveFile(data, name, mime); });
            } catch (Exception e) { main.post(() -> { saving = false; toast("Download failed. Check your connection and try again."); }); }
            finally { if (connection != null) connection.disconnect(); }
        });
    }
    private void saveFile(byte[] data, String name, String mime) {
        if (saving) { toast("Finish the current download first."); return; }
        pendingDownload = data; saving = true;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime != null && mime.matches("[\\w.+-]+/[\\w.+-]+") ? mime : "application/octet-stream").putExtra(Intent.EXTRA_TITLE, NavigationPolicy.filename(name));
        try { startActivityForResult(intent, SAVE_FILE); }
        catch (ActivityNotFoundException e) { pendingDownload = null; saving = false; toast("No document provider is available to save the file."); }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && filePicker != null) { filePicker.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data)); filePicker = null; }
        if (request == SAVE_FILE) {
            byte[] bytes = pendingDownload; pendingDownload = null;
            if (result != RESULT_OK || data == null || data.getData() == null || bytes == null) { saving = false; return; }
            Uri target = data.getData(); io.execute(() -> {
                boolean success = false;
                try (OutputStream out = getContentResolver().openOutputStream(target)) { if (out != null) { out.write(bytes); success = true; } }
                catch (Exception ignored) { }
                boolean done = success; main.post(() -> { saving = false; toast(done ? "File saved." : "The file could not be saved. Try again."); });
            });
        }
    }
    private void toast(String message) { Toast.makeText(this, message, Toast.LENGTH_LONG).show(); }
    @Override protected void onSaveInstanceState(Bundle state) { super.onSaveInstanceState(state); state.putString("page", NavigationPolicy.internal(web.getUrl()) ? web.getUrl() : retryUrl); }
    @Override protected void onPause() { CookieManager.getInstance().flush(); web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) { web.onResume(); updateConnectivity(); } }
    @Override public void onConfigurationChanged(Configuration configuration) { super.onConfigurationChanged(configuration); }
    @Override protected void onDestroy() {
        if (networkCallback != null) connectivity.unregisterNetworkCallback(networkCallback);
        if (filePicker != null) filePicker.onReceiveValue(null);
        closePort(); pendingDownload = null; io.shutdownNow(); web.destroy(); super.onDestroy();
    }
}
