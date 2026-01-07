import React from 'react';
import { 
  Sun, 
  Moon, 
  Cloud, 
  CloudSun, 
  CloudMoon,
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Droplets,
  Wind,
  ThermometerSun,
  ThermometerSnowflake,
  MapPin,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWeather, getWeatherDescription, City } from '@/hooks/useWeather';
import { cn } from '@/lib/utils';

const getWeatherIcon = (code: number, isDay: boolean, className?: string) => {
  const iconClass = cn("h-8 w-8 md:h-10 md:w-10", className);
  
  // Céu limpo
  if (code === 0) {
    return isDay 
      ? <Sun className={cn(iconClass, "text-yellow-500 animate-pulse")} />
      : <Moon className={cn(iconClass, "text-blue-300")} />;
  }
  
  // Parcialmente nublado
  if (code >= 1 && code <= 2) {
    return isDay
      ? <CloudSun className={cn(iconClass, "text-yellow-400")} />
      : <CloudMoon className={cn(iconClass, "text-blue-200")} />;
  }
  
  // Nublado
  if (code === 3) {
    return <Cloud className={cn(iconClass, "text-muted-foreground")} />;
  }
  
  // Nevoeiro
  if (code >= 45 && code <= 48) {
    return <CloudFog className={cn(iconClass, "text-muted-foreground")} />;
  }
  
  // Garoa
  if (code >= 51 && code <= 55) {
    return <CloudDrizzle className={cn(iconClass, "text-blue-400")} />;
  }
  
  // Chuva
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
    return <CloudRain className={cn(iconClass, "text-blue-500")} />;
  }
  
  // Neve
  if (code >= 71 && code <= 77) {
    return <CloudSnow className={cn(iconClass, "text-blue-200")} />;
  }
  
  // Tempestade
  if (code >= 95 && code <= 99) {
    return <CloudLightning className={cn(iconClass, "text-yellow-500")} />;
  }
  
  return <Cloud className={cn(iconClass, "text-muted-foreground")} />;
};

const WeatherWidget: React.FC = () => {
  const { weather, selectedCity, cities, loading, error, changeCity, refetch } = useWeather();

  if (error) {
    return (
      <section className="py-4 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground">
            <Cloud className="h-5 w-5" />
            <span className="text-sm">Previsão indisponível</span>
            <button 
              onClick={refetch}
              className="ml-2 p-1 hover:bg-accent/50 rounded-full transition-colors"
              aria-label="Tentar novamente"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 px-4 animate-fade-in" aria-label="Previsão do tempo">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 md:p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Seletor de cidade e ícone */}
            <div className="flex items-center gap-3">
              {/* Ícone do clima */}
              <div className="flex-shrink-0">
                {loading ? (
                  <div className="h-10 w-10 rounded-full bg-muted/50 animate-pulse" />
                ) : weather ? (
                  getWeatherIcon(weather.weatherCode, weather.isDay)
                ) : null}
              </div>

              {/* Cidade e condição */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select
                    value={`${selectedCity.lat},${selectedCity.lon}`}
                    onValueChange={(value) => {
                      const city = cities.find(c => `${c.lat},${c.lon}` === value);
                      if (city) changeCity(city);
                    }}
                  >
                    <SelectTrigger className="h-auto p-0 border-0 bg-transparent shadow-none focus:ring-0 text-sm font-medium hover:text-primary transition-colors w-auto gap-1">
                      <SelectValue>
                        {selectedCity.name}, {selectedCity.state}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {cities.map((city) => (
                        <SelectItem 
                          key={`${city.lat},${city.lon}`} 
                          value={`${city.lat},${city.lon}`}
                          className="cursor-pointer"
                        >
                          {city.name}, {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {loading ? (
                  <div className="h-4 w-24 bg-muted/50 rounded animate-pulse mt-1" />
                ) : weather ? (
                  <span className="text-xs text-muted-foreground">
                    {getWeatherDescription(weather.weatherCode)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Temperatura principal */}
            <div className="flex items-center gap-6 md:gap-8">
              {loading ? (
                <div className="h-10 w-16 bg-muted/50 rounded animate-pulse" />
              ) : weather ? (
                <div className="flex items-baseline">
                  <span className="text-3xl md:text-4xl font-bold text-foreground">
                    {weather.temperature}
                  </span>
                  <span className="text-lg text-muted-foreground">°C</span>
                </div>
              ) : null}

              {/* Informações secundárias */}
              {!loading && weather && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {/* Min/Max */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <ThermometerSnowflake className="h-4 w-4 text-blue-400" />
                      <span>{weather.tempMin}°</span>
                    </div>
                    <span className="text-muted-foreground/50">/</span>
                    <div className="flex items-center gap-1">
                      <ThermometerSun className="h-4 w-4 text-orange-400" />
                      <span>{weather.tempMax}°</span>
                    </div>
                  </div>

                  {/* Umidade */}
                  <div className="flex items-center gap-1" title="Umidade">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <span>{weather.humidity}%</span>
                  </div>

                  {/* Vento */}
                  <div className="flex items-center gap-1" title="Velocidade do vento">
                    <Wind className="h-4 w-4 text-cyan-400" />
                    <span>{weather.windSpeed} km/h</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherWidget;
