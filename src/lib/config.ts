/**
 * Configuración central de la app. Todo lo que podría cambiar el día de la demostración
 * (URL de la API, token, orden de bytes) vive aquí y no regado por el código.
 */
export const APP = {
  nombre: 'Umbral',
  lema: 'Credencial NFC para personal de salud',
  sector: 'Hospitales y Centros de Salud',
  version: '1.0.0',
};

export const API = {
  /** API de la práctica 2 (login) y de la tarea 10 (imagen de perfil) */
  baseUrl: 'https://monsterballgo.com/api',
  /** Token de acceso que exige la API en cada petición */
  token: 'code37',
  /** Tiempo máximo de espera por petición */
  timeoutMs: 12000,
  /** Imagen que usa el servidor cuando el usuario no tiene foto */
  defaultPfp: 'https://monsterballgo.com/media/usr/default.png',
};

export const NFC = {
  /** Debe coincidir con credencial_apduservice.xml y con el SELECT del firmware */
  aid: 'F0 12 34 56 78',
  /**
   * Orden de los 4 bytes del número de usuario.
   * 'LE' (little-endian): el firmware hace memcpy(&id, userId, 4) y el ESP32 es little-endian,
   * así que el byte menos significativo debe ir primero. Ver README, sección "Orden de bytes".
   */
  byteOrder: 'LE' as 'LE' | 'BE',
};
