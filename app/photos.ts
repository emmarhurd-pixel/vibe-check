export type Photo = {
  id: string;
  src: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  downloadLocation: string;
};

type UnsplashPhoto = {
  id: string;
  alt_description: string | null;
  urls: { small: string };
  user: { name: string; links: { html: string } };
  links: { download_location: string };
};

const utm = "utm_source=outfit_app&utm_medium=referral";
export const UNSPLASH_URL = `https://unsplash.com/?${utm}`;

const cache = new Map<string, Photo[]>();

async function searchUnsplash(query: string): Promise<Photo[]> {
  const cached = cache.get(query);
  if (cached) return cached;

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=4&orientation=portrait`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      "Accept-Version": "v1",
    },
  });
  if (!res.ok) throw new Error(`Unsplash error ${res.status}`);

  const data = await res.json();
  const photos = (data.results as UnsplashPhoto[]).map((p) => ({
    id: `unsplash-${p.id}`,
    src: p.urls.small,
    alt: p.alt_description ?? query,
    photographer: p.user.name,
    photographerUrl: `${p.user.links.html}?${utm}`,
    downloadLocation: p.links.download_location,
  }));

  cache.set(query, photos);
  return photos;
}

export async function getInspoPhotos(searches: string[]): Promise<Photo[]> {
  if (!process.env.UNSPLASH_ACCESS_KEY) return [];

  const results = await Promise.allSettled(searches.map((query) => searchUnsplash(query)));

  const seen = new Set<string>();
  return results
    .flatMap((result) => {
      if (result.status === "fulfilled") return result.value;
      console.error("Photo search failed:", result.reason);
      return [];
    })
    .filter((photo) => {
      if (seen.has(photo.id)) return false;
      seen.add(photo.id);
      return true;
    });
}

export function pinterestSearchUrl(query: string): string {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
}