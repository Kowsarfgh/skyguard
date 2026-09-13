import type { WeatherConditions, WeatherData } from "../../types";

export const DEMO_LOCATION = {
  latitude: 38.0962,
  longitude: 46.2738,
  placeName: "Tabriz, Iran"
};

export const generateDemoWeather = (date: string): WeatherData => {
  const tempsByHour: Record<number, number> = {
    0: 12, 1: 11, 2: 10, 3: 9, 4: 9, 5: 10,
    6: 12, 7: 14, 8: 17, 9: 20, 10: 24, 11: 27,
    12: 29, 13: 31, 14: 32, 15: 31, 16: 28, 17: 25,
    18: 22, 19: 19, 20: 17, 21: 15, 22: 14, 23: 13
  };
  const rainByHour: Record<number, number> = {
    0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 10,
    6: 10, 7: 10, 8: 10, 9: 15, 10: 25, 11: 40,
    12: 55, 13: 65, 14: 60, 15: 50, 16: 35, 17: 20,
    18: 15, 19: 10, 20: 10, 21: 5, 22: 5, 23: 5
  };
  const rainMmByHour: Record<number, number> = {
    12: 1.2, 13: 3.5, 14: 2.8, 15: 1.8
  };
  const windByHour: Record<number, number> = {
    0: 8, 6: 10, 9: 14, 12: 20, 14: 28, 15: 32, 18: 22, 21: 12
  };
  const uvByHour: Record<number, number> = {
    6: 1, 7: 2, 8: 4, 9: 6, 10: 7, 11: 8,
    12: 9, 13: 9, 14: 8, 15: 7, 16: 5, 17: 3, 18: 1
  };

  const hours: WeatherConditions[] = [];
  for (let h = 0; h < 24; h++) {
    const temp = tempsByHour[h] ?? 15;
    const prob = rainByHour[h] ?? 5;
    const mm = rainMmByHour[h] ?? (prob > 50 ? 0.8 : prob > 25 ? 0.2 : 0);
    const wind = windByHour[h] ?? 12;
    const humidity = 100 - Math.min(60, temp - 5) + prob * 0.3;
    hours.push({
      timestamp: `${date}T${h.toString().padStart(2, "0")}:00:00`,
      hour: h,
      temperatureC: temp,
      feelsLikeC: temp + (h >= 12 && h <= 16 ? 3 : 0),
      precipitationProbability: prob,
      precipitationAmountMm: mm,
      windSpeedKmh: wind,
      windGustKmh: wind * 1.4,
      relativeHumidity: Math.round(Math.max(20, Math.min(98, humidity))),
      visibilityKm: prob > 50 ? 4 : prob > 25 ? 8 : 15,
      weatherCode: prob > 55 ? 63 : prob > 25 ? 61 : temp > 28 ? 0 : 2,
      uvIndex: uvByHour[h] ?? 0,
      cloudCover: Math.min(100, prob + 20)
    });
  }

  return {
    location: { ...DEMO_LOCATION },
    date,
    hours
  };
};
