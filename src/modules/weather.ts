import { WelcomeModule } from './base';
import { WelcomeConfig, WeatherConfig } from '../types/config';
import { colorBoldText, colorText } from '../utils/color';
import { logger } from '../utils/logger';
import { apiRequest } from '../utils/cache';

// --- Types for Open-Meteo API responses ---
interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}
interface GeocodingResponse {
  results: GeocodingResult[];
}
interface WeatherCurrent {
  temperature_2m: number;
  weather_code: number;
  is_day: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
}
interface WeatherResponse {
  current: WeatherCurrent;
}

// --- Helper functions ---
function getUnits(config: WeatherConfig): 'fahrenheit' | 'celsius' {
  return config.units === 'imperial' ? 'fahrenheit' : 'celsius';
}

function getTempColor(temp: number, units: 'fahrenheit' | 'celsius'): 'cyan' | 'blue' | 'green' | 'yellow' | 'magenta' | 'red' | 'white' {
  const t = units === 'celsius' ? temp * 9/5 + 32 : temp;
  if (t < 32) return 'cyan';
  if (t < 50) return 'blue';
  if (t < 70) return 'green';
  if (t < 85) return 'yellow';
  if (t < 95) return 'magenta';
  if (t >= 95) return 'red';
  return 'white';
}

function getWeatherEmoji(code: number, isDay: number): string {
  switch (code) {
    case 0: return isDay ? '☀️' : '🌙';
    case 1: return isDay ? '🌤️' : '🌙';
    case 2: return isDay ? '⛅' : '☁️';
    case 3: return '☁️';
    case 45:
    case 48: return '🌫️';
    case 51:
    case 53:
    case 55: return '🌦️';
    case 56:
    case 57: return '🌨️';
    case 61:
    case 63:
    case 65: return '🌧️';
    case 66:
    case 67: return '🌨️';
    case 71:
    case 73:
    case 75: return '❄️';
    case 77: return '❄️';
    case 80:
    case 81:
    case 82: return '🌧️';
    case 85:
    case 86: return '🌨️';
    case 95: return '⛈️';
    case 96:
    case 99: return '⛈️';
    default: return '🌡️';
  }
}

function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45:
    case 48: return 'Foggy';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 56:
    case 57: return 'Freezing drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 66:
    case 67: return 'Freezing rain';
    case 71: return 'Slight snow';
    case 73: return 'Moderate snow';
    case 75: return 'Heavy snow';
    case 77: return 'Snow grains';
    case 80: return 'Light rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 85:
    case 86: return 'Snow showers';
    case 95: return 'Thunderstorm';
    case 96:
    case 99: return 'Thunderstorm with hail';
    default: return 'Unknown';
  }
}

async function geocodeCity(city: string, country?: string): Promise<GeocodingResult | undefined> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json${country ? `&country=${encodeURIComponent(country)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const data = await res.json() as GeocodingResponse;
  return data.results && data.results.length > 0 ? data.results[0] : undefined;
}

async function fetchWeather(lat: number, lon: number, units: 'fahrenheit' | 'celsius'): Promise<WeatherResponse> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto&temperature_unit=${units}&wind_speed_unit=${units === 'fahrenheit' ? 'mph' : 'kmh'}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json() as Promise<WeatherResponse>;
}

// --- Main module class ---
class WeatherModule implements WelcomeModule {
  name = 'weather';
  private lat?: number;
  private lon?: number;
  private locationName?: string;
  private country?: string;

  async setup(config: WelcomeConfig): Promise<void> {
    const { city, country } = config.weather;
    if (!city) {
      logger.warn('No weather city set in configuration, defaulting to New York');
      this.locationName = 'New York';
      this.country = 'US';
    } else {
      this.locationName = city;
      this.country = country;
    }
    // Geocode city to lat/lon
    const geo = await geocodeCity(this.locationName, this.country);
    if (geo) {
      this.lat = geo.latitude;
      this.lon = geo.longitude;
      this.locationName = geo.name;
      this.country = geo.country;
    } else {
      logger.warn(`Could not geocode city: ${this.locationName}`);
    }
  }

  async display(config: WelcomeConfig): Promise<string> {
    if (!this.lat || !this.lon) {
      return `${colorBoldText('cyan', '▶')} Weather: ${colorText('red', 'Could not find location')}`;
    }
    const units = getUnits(config.weather);
    let weather: WeatherResponse;
    try {
      weather = await apiRequest<WeatherResponse>(
        `weather_${this.lat}_${this.lon}_${units}`,
        config.cache.weatherDuration,
        () => fetchWeather(this.lat!, this.lon!, units)
      );
    } catch (e) {
      logger.warn('Failed to fetch weather: ' + e);
      return `${colorBoldText('cyan', '▶')} Weather: ${colorText('red', 'Failed to retrieve weather data')}`;
    }
    const current = weather.current;
    const temp = current.temperature_2m;
    const code = current.weather_code;
    const isDay = current.is_day;
    const emoji = getWeatherEmoji(code, isDay);
    const tempColor = getTempColor(temp, units);
    const tempUnit = units === 'fahrenheit' ? '°F' : '°C';
    const tempDisplay = colorBoldText(tempColor, `${Math.round(temp)}${tempUnit}`);
    const description = getWeatherDescription(code);
    let message = `${colorBoldText('cyan', '▶')} ${colorBoldText('white', 'Weather:')} ${emoji} ${tempDisplay} in ${this.locationName}`;
    message += ` - ${colorText('white', description)}`;
    if (config.weather.showHumidity && typeof current.relative_humidity_2m === 'number') {
      message += ` | ${colorText('blue', `💧 ${current.relative_humidity_2m}%`)}`;
    }
    if (config.weather.showWind && typeof current.wind_speed_10m === 'number') {
      const windUnit = units === 'fahrenheit' ? 'mph' : 'km/h';
      message += ` | ${colorText('white', `💨 ${Math.round(current.wind_speed_10m)} ${windUnit}`)}`;
    }
    return message + '\n';
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
    return Promise.resolve();
  }
}

export const weatherModule = new WeatherModule(); 