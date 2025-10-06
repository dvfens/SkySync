import { NewsItem, LocationData } from '@/types/weather';

// Uses Google News RSS; no API key required. We query for weather-related news scoped to location.
const GOOGLE_NEWS_RSS = 'https://news.google.com/rss';

function buildQuery(location: LocationData): string {
  const parts = [location.city, location.region, 'weather OR storm OR rain OR heat OR flood']
    .filter(Boolean)
    .join(' ');
  return encodeURIComponent(parts);
}

export async function fetchWeatherNews(location: LocationData): Promise<NewsItem[]> {
  try {
    const q = buildQuery(location);
    const url = `${GOOGLE_NEWS_RSS}?q=${q}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const xml = await res.text();

    // Minimal XML parsing without extra deps
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml))) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link = (block.match(/<link>(.*?)<\/link>/))?.[1] || '';
      const source = (block.match(/<source[^>]*><!\[CDATA\[(.*?)\]\]><\/source>/))?.[1] || undefined;
      const pub = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || undefined;
      if (title && link) items.push({ title, link, source, publishedAt: pub });
    }

    // If empty (e.g., due to CORS on web), try rss2json fallback
    if (items.length === 0) {
      const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      try {
        const r2 = await fetch(api);
        if (r2.ok) {
          const json = await r2.json();
          const viaJson: NewsItem[] = (json.items || []).map((it: any) => ({
            title: it.title,
            link: it.link,
            source: json.feed?.title,
            publishedAt: it.pubDate,
          }));
          const dedupJson = Array.from(new Map(viaJson.map((n) => [n.link, n])).values());
          return dedupJson.slice(0, 8);
        }
      } catch {}
    }

    // Deduplicate by link
    const unique = Array.from(new Map(items.map((n) => [n.link, n])).values());
    return unique.slice(0, 8);
  } catch (e) {
    console.error('Error fetching weather news:', e);
    return [];
  }
}


