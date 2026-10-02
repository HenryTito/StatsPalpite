'use strict';

/** Contrato do provedor de clima (RF15). */
class WeatherProvider {
  get name() {
    throw new Error('não implementado');
  }

  /**
   * @param {{latitude: number, longitude: number, at: Date}} query
   * @returns {Promise<import('../contracts').WeatherDTO|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async fetchForecast(query) {
    throw new Error('não implementado');
  }
}

module.exports = WeatherProvider;
