'use strict';

const WeatherProvider = require('./WeatherProvider');
const { getJson } = require('../http');

const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

/**
 * Adapter do OpenWeatherMap (RF15). A API devolve a previsão em blocos de 3
 * horas; escolhemos o bloco mais próximo do horário da partida.
 */
class OpenWeatherProvider extends WeatherProvider {
  constructor({ apiKey, lang = 'pt_br', units = 'metric' }) {
    super();
    if (!apiKey) throw new Error('OpenWeatherProvider exige uma API key');
    this.apiKey = apiKey;
    this.lang = lang;
    this.units = units;
  }

  get name() {
    return 'openweathermap';
  }

  async fetchForecast({ latitude, longitude, at }) {
    if (latitude === null || latitude === undefined) return null;

    const url = new URL(BASE_URL);
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('appid', this.apiKey);
    url.searchParams.set('units', this.units);
    url.searchParams.set('lang', this.lang);

    const body = await getJson(url.toString(), { provider: this.name });
    const slots = body?.list ?? [];
    if (!slots.length) return null;

    const target = (at instanceof Date ? at : new Date(at)).getTime();
    const closest = slots.reduce((best, slot) => {
      const distance = Math.abs(slot.dt * 1000 - target);
      return !best || distance < best.distance ? { slot, distance } : best;
    }, null);

    const slot = closest.slot;
    return {
      temperatureC: slot.main?.temp ?? null,
      feelsLikeC: slot.main?.feels_like ?? null,
      condition: slot.weather?.[0]?.description ?? 'Desconhecido',
      humidity: slot.main?.humidity ?? null,
      windKph: slot.wind?.speed !== undefined ? Math.round(slot.wind.speed * 3.6) : null,
      precipitationMm: slot.rain?.['3h'] ?? 0,
      observedFor: new Date(slot.dt * 1000).toISOString(),
    };
  }
}

module.exports = OpenWeatherProvider;
