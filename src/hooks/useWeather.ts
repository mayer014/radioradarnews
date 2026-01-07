import { useState, useEffect, useCallback } from 'react';

export interface City {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  tempMax: number;
  tempMin: number;
  isDay: boolean;
}

export const BRAZILIAN_CITIES: City[] = [
  { name: 'Campo Grande', state: 'MS', lat: -20.4697, lon: -54.6201 },
  { name: 'São Paulo', state: 'SP', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lon: -43.1729 },
  { name: 'Brasília', state: 'DF', lat: -15.7975, lon: -47.8919 },
  { name: 'Belo Horizonte', state: 'MG', lat: -19.9167, lon: -43.9345 },
  { name: 'Salvador', state: 'BA', lat: -12.9714, lon: -38.5014 },
  { name: 'Curitiba', state: 'PR', lat: -25.4284, lon: -49.2733 },
  { name: 'Recife', state: 'PE', lat: -8.0476, lon: -34.8770 },
  { name: 'Porto Alegre', state: 'RS', lat: -30.0346, lon: -51.2177 },
  { name: 'Manaus', state: 'AM', lat: -3.1190, lon: -60.0217 },
  { name: 'Fortaleza', state: 'CE', lat: -3.7172, lon: -38.5433 },
  { name: 'Marabá', state: 'PA', lat: -5.3687, lon: -49.1178 },
];

const CACHE_KEY = 'weather_cache';
const CITY_KEY = 'weather_selected_city';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

interface CacheData {
  data: WeatherData;
  cityKey: string;
  timestamp: number;
}

export const getWeatherDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    0: 'Céu limpo',
    1: 'Majoritariamente limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Nevoeiro',
    48: 'Nevoeiro com geada',
    51: 'Garoa leve',
    53: 'Garoa moderada',
    55: 'Garoa intensa',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    71: 'Neve leve',
    73: 'Neve moderada',
    75: 'Neve forte',
    77: 'Granizo',
    80: 'Pancadas leves',
    81: 'Pancadas moderadas',
    82: 'Pancadas fortes',
    95: 'Tempestade',
    96: 'Tempestade com granizo leve',
    99: 'Tempestade com granizo forte',
  };
  return descriptions[code] || 'Desconhecido';
};

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedCity, setSelectedCity] = useState<City>(() => {
    const saved = localStorage.getItem(CITY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return BRAZILIAN_CITIES[0];
      }
    }
    return BRAZILIAN_CITIES[0];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCityKey = (city: City) => `${city.lat},${city.lon}`;

  const fetchWeather = useCallback(async (city: City) => {
    const cityKey = getCityKey(city);
    
    // Verificar cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const cacheData: CacheData = JSON.parse(cached);
        if (
          cacheData.cityKey === cityKey &&
          Date.now() - cacheData.timestamp < CACHE_DURATION
        ) {
          setWeather(cacheData.data);
          setLoading(false);
          return;
        }
      } catch {
        // Cache inválido, continuar com fetch
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo`
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar previsão do tempo');
      }

      const data = await response.json();

      const weatherData: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        tempMax: Math.round(data.daily.temperature_2m_max[0]),
        tempMin: Math.round(data.daily.temperature_2m_min[0]),
        isDay: data.current.is_day === 1,
      };

      // Salvar no cache
      const cacheData: CacheData = {
        data: weatherData,
        cityKey,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      setWeather(weatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const changeCity = useCallback((city: City) => {
    setSelectedCity(city);
    localStorage.setItem(CITY_KEY, JSON.stringify(city));
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity, fetchWeather]);

  return {
    weather,
    selectedCity,
    cities: BRAZILIAN_CITIES,
    loading,
    error,
    changeCity,
    refetch: () => fetchWeather(selectedCity),
  };
};
