import { useEffect, useState } from "react";

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  city: string;
}

const codeToLabel = (code: number): string => {
  if (code === 0) return "Ciel dégagé ☀️";
  if ([1, 2, 3].includes(code)) return "Partiellement nuageux ⛅";
  if ([45, 48].includes(code)) return "Brouillard 🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine 🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Pluie 🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neige 🌨️";
  if ([95, 96, 99].includes(code)) return "Orage ⛈️";
  return "Météo inconnue";
};

const WeatherCard = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchByCoords = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await res.json();

        let city = "Votre position";
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=fr`
          );
          const geo = await geoRes.json();
          if (geo?.results?.[0]?.name) city = geo.results[0].name;
        } catch {
          // ignore
        }

        setWeather({
          temperature: data.current_weather.temperature,
          windspeed: data.current_weather.windspeed,
          weathercode: data.current_weather.weathercode,
          city,
        });
      } catch (e) {
        setError("Impossible de récupérer la météo");
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      // Fallback Paris
      fetchByCoords(48.8566, 2.3522);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => fetchByCoords(48.8566, 2.3522),
      { timeout: 5000 }
    );
  }, []);

  return (
    <div
      className="w-full rounded-lg bg-card p-6"
      style={{ boxShadow: "var(--shadow-glow)" }}
    >
      <h2 className="text-xl font-bold text-primary">Météo</h2>
      {loading && <p className="mt-3 text-accent">Chargement...</p>}
      {error && <p className="mt-3 text-destructive">{error}</p>}
      {weather && (
        <div className="mt-3 space-y-1 text-accent">
          <p className="text-lg">📍 {weather.city}</p>
          <p className="text-3xl font-bold text-primary">
            {Math.round(weather.temperature)}°C
          </p>
          <p>{codeToLabel(weather.weathercode)}</p>
          <p className="text-sm opacity-80">Vent : {weather.windspeed} km/h</p>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
