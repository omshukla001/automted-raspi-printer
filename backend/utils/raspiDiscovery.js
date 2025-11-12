const axios = require('axios');

let cachedRaspiBaseUrl = null;
let lastFetchedAt = 0;
const MIN_REFRESH_INTERVAL_MS = 10 * 1000; // 10 seconds

/**
 * Returns the current Raspberry Pi base URL discovered from Cloudflare Tunnel.
 * Example: https://abc123.trycloudflare.com
 */
function getRaspiApiUrl() {
  return cachedRaspiBaseUrl;
}

/**
 * Attempt to fetch the Cloudflare Tunnel public URL from the local cloudflared API.
 * The Pi should run cloudflared with the metrics API on 127.0.0.1:4040.
 * We pick the first http(s) URL that is public.
 */
async function fetchCloudflareTunnelUrl() {
  try {
    // 1) If a discovery URL for the Pi is provided, ask it to return the tunnel URL
    //    Expected endpoint: GET {RASPI_DISCOVERY_URL}/tunnel -> { url: "https://..." }
    const raspiDiscoveryBase = process.env.RASPI_DISCOVERY_URL && process.env.RASPI_DISCOVERY_URL.replace(/\/$/, '');
    if (raspiDiscoveryBase) {
      try {
        const resp = await axios.get(`${raspiDiscoveryBase}/tunnel`, { timeout: 3000 });
        const publicUrl = resp.data && (resp.data.publicUrl || resp.data.public_url || resp.data.url);
        if (publicUrl) {
          cachedRaspiBaseUrl = String(publicUrl).replace(/\/$/, '');
          lastFetchedAt = Date.now();
          console.log('[RaspiDiscovery] Discovered via Pi /tunnel:', cachedRaspiBaseUrl);
          return cachedRaspiBaseUrl;
        }
      } catch (err) {
        console.warn('[RaspiDiscovery] Failed to fetch from Pi /tunnel:', err.message);
      }
    }

    // 1.5) Try to fetch from Cloudflare metrics directly (if accessible)
    try {
      const metricsUrl = process.env.CLOUDFLARE_METRICS_URL || 'http://127.0.0.1:4040/metrics';
      const resp = await axios.get(metricsUrl, { timeout: 3000 });
      const body = resp.data;
      const match = body.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        cachedRaspiBaseUrl = match[0].replace(/\/$/, '');
        lastFetchedAt = Date.now();
        console.log('[RaspiDiscovery] Discovered via Cloudflare metrics:', cachedRaspiBaseUrl);
        return cachedRaspiBaseUrl;
      }
    } catch (err) {
      // Silently ignore if metrics not accessible
    }

    // 2) If a direct cloudflared API URL is provided, use that
    const cfApi = process.env.CLOUDFLARE_API_URL || 'http://127.0.0.1:4040/api/tunnels';
    try {
      const resp = await axios.get(cfApi, { timeout: 3000 });
      const tunnels = resp.data && resp.data.tunnels ? resp.data.tunnels : [];
      const preferred = tunnels.find(t => typeof t.public_url === 'string' && t.public_url.startsWith('https://'))
        || tunnels.find(t => typeof t.public_url === 'string' && t.public_url.startsWith('http://'))
        || null;
      if (preferred && preferred.public_url) {
        cachedRaspiBaseUrl = preferred.public_url.replace(/\/$/, '');
        lastFetchedAt = Date.now();
        console.log('[RaspiDiscovery] Discovered via Cloudflared API:', cachedRaspiBaseUrl);
        return cachedRaspiBaseUrl;
      }
    } catch (_) {}
  } catch (err) {
    // Silently ignore if cloudflared API not reachable
  }
  return null;
}

/**
 * Initialize a periodic watcher that keeps the discovered URL up to date.
 * If cloudflared is not yet up, it will retry periodically.
 */
async function initializeRaspiTunnelWatcher() {
  // Initial fetch
  await fetchCloudflareTunnelUrl();

  // Periodic refresh
  setInterval(async () => {
    const now = Date.now();
    if (now - lastFetchedAt < MIN_REFRESH_INTERVAL_MS) return;
    await fetchCloudflareTunnelUrl();
  }, MIN_REFRESH_INTERVAL_MS);
}

module.exports = {
  getRaspiApiUrl,
  initializeRaspiTunnelWatcher,
};


