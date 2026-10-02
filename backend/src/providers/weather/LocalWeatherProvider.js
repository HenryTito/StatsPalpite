'use strict';

const WeatherProvider = require('./WeatherProvider');

const CONDITIONS = ['Céu limpo', 'Parcialmente nublado', 'Nublado', 'Chuva fraca', 'Chuva moderada'];

/**
 * Previsão local determinística: a mesma coordenada no mesmo horário devolve
 * sempre o mesmo clima, o que mantém os testes estáveis. Serve de fallback do
 * RNF11 quando o OpenWeatherMap não responde.
 */
class LocalWeatherProvider extends WeatherProvider {
  get name() {
    return 'local';
  }

  async fetchForecast({ latitude, longitude, at }) {
    if (latitude === null || latitude === undefined) return null;

    const moment = at instanceof Date ? at : new Date(at);
    // Semente a partir da coordenada e do dia: estável, mas variada.
    const seed = Math.abs(
      Math.round(Number(latitude) * 100) + Math.round(Number(longitude) * 100) + moment.getUTCDate(),
    );
    const condition = CONDITIONS[seed % CONDITIONS.length];
    // Hemisfério sul fica mais quente; aproximação suficiente para a previsão.
    const baseTemperature = Number(latitude) < 0 ? 24 : 16;
    const temperature = baseTemperature + (seed % 9) - 4;

    return {
      temperatureC: temperature,
      feelsLikeC: temperature - 1,
      condition,
      humidity: 50 + (seed % 40),
      windKph: 5 + (seed % 20),
      precipitationMm: condition.startsWith('Chuva') ? 1 + (seed % 8) : 0,
      observedFor: moment.toISOString(),
    };
  }
}

module.exports = LocalWeatherProvider;
