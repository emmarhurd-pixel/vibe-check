export type Weather = {
  high: number;
  low: number;
  description: string;
  rainChance?: number;
  isForecast: boolean;
};

type Place = {
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
};

function describe(code: number): string {
  if (code === 0) return "Clear skies";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorms";
}

async function findCity(city: string): Promise<Place | null> {
  const [name, region] = city.split(",").map((part) => part.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`;
  const data = await (await fetch(url)).json();
  const results: Place[] = data.results ?? [];
  if (results.length === 0) return null;

  if (region) {
    const r = region.toLowerCase();
    const match = results.find(
      (p) => p.admin1?.toLowerCase().includes(r) || p.country?.toLowerCase().includes(r)
    );
    if (match) return match;
  }
  return results[0];
}

export async function getWeather(city?: string, date?: string): Promise<Weather | null> {
  if (!city || !date) return null;

  try {
    const place = await findCity(city);
    if (!place) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(`${date}T00:00:00`);
    const daysAway = Math.round((eventDay.getTime() - today.getTime()) / 86400000);
    const isForecast = daysAway >= 0 && daysAway <= 15;

    const location = `latitude=${place.latitude}&longitude=${place.longitude}`;
    const settings = "temperature_unit=fahrenheit&timezone=auto";
    let url: string;

    if (isForecast) {
      url = `https://api.open-meteo.com/v1/forecast?${location}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&${settings}&start_date=${date}&end_date=${date}`;
    } else {
      const lastYear = `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;
      url = `https://archive-api.open-meteo.com/v1/archive?${location}&daily=temperature_2m_max,temperature_2m_min,weather_code&${settings}&start_date=${lastYear}&end_date=${lastYear}`;
    }

    const daily = (await (await fetch(url)).json()).daily;
    if (!daily) return null;

    return {
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      description: describe(daily.weather_code[0]),
      rainChance: isForecast ? daily.precipitation_probability_max?.[0] : undefined,
      isForecast,
    };
  } catch (error) {
    console.error("Weather lookup failed:", error);
    return null;
  }
}