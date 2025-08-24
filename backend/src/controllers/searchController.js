import axios from 'axios';
import WeatherCache from '../models/WeatherCache.js';

/**
 * Worldwide city search using OpenWeather Geocoding API.
 * - Query examples users can type:
 *   "Paris" | "Paris,FR" | "Springfield,US" | "Sydney,AU" | "Delhi,IN"
 * - Returns: [{ name, state, country, lat, lon }, ...]
 * - Caches each query in Mongo for GEO_CACHE_TTL seconds.
 */

const GEO_TTL = parseInt(process.env.GEO_CACHE_TTL || '604800', 10); // default 7 days

function normalize(items = []) {
  return items.map(c => ({
    name: c.name,
    state: c.state ?? null,
    country: c.country ?? null,
    lat: c.lat,
    lon: c.lon,
  })).filter(c => c?.name && typeof c.lat === 'number' && typeof c.lon === 'number');
}

function isFresh(hit, ttl) {
  if (!hit) return false;
  const age = Date.now() - new Date(hit.fetchedAt).getTime();
  return age < ttl * 1000;
}

export async function search(req, res) {
  const raw = (req.query.q || '').trim();
  if (!raw) return res.status(400).json({ error: 'Missing q' });

  const key = (process.env.OPENWEATHER_API_KEY || '').trim();
  if (!key) {
    // No key -> worldwide provider cannot be used
    // Return empty array (so UI shows "No matches") instead of hardcoded list
    return res.json([]);
  }

  const cacheKey = `geo:${raw.toLowerCase()}`;

  try {
    // try cache first
    const hit = await WeatherCache.findOne({ key: cacheKey }).lean();
    if (isFresh(hit, GEO_TTL)) {
      return res.json(hit.data);
    }

    // fetch from OpenWeather
    const { data } = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
      params: { q: raw, limit: 5, appid: key },
      timeout: 8000,
    });

    const out = normalize(Array.isArray(data) ? data : []);
    // save to cache (even empty to avoid hammering)
    await WeatherCache.updateOne(
      { key: cacheKey },
      { $set: { data: out, fetchedAt: new Date() } },
      { upsert: true }
    );

    return res.json(out);
  } catch (err) {
    const status = err?.response?.status;
    const code = err?.code;
    const msg = err?.response?.data || err?.message;
    console.error('OpenWeather geocode error:', status || code, msg);

    // return cached (stale) if we have it, else empty array
    const stale = await WeatherCache.findOne({ key: cacheKey }).lean();
    if (stale?.data) return res.json(stale.data);

    return res.json([]); // no hardcoded fallback; worldwide = empty means "no matches" in UI
  }
}
