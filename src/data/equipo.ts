import type { LogoSlug } from './logos.generated';

/** Información local de la pantalla de créditos (no depende de la API). */
export const EQUIPO = {
  nombre: 'Ciberpunks',
  materia: 'Aplicaciones Móviles',
  grupo: '900 CIB',
  profesor: 'M. en C. Felipe Mandujano Gómez',
  institucion: 'Universidad La Salle México · Facultad de Ingeniería',
  fecha: '26 de octubre de 2026',
  integrantes: [
    { nombre: 'Edgar Allan Espinosa Hinojosa', iniciales: 'EE', color: '#0F9F94' },
    { nombre: 'Patricio Ruiz Cerdeño', iniciales: 'PR', color: '#2563EB' },
    { nombre: 'Adrián Emiliano Leyva Durante', iniciales: 'AL', color: '#7C3AED' },
  ],
};

export type Tecnologia = {
  nombre: string;
  uso: string;
  /** null cuando la tecnología no tiene un logotipo oficial (p. ej. un protocolo) */
  logo: LogoSlug | null;
  capa: 'App móvil' | 'Sistema de acceso' | 'Herramientas';
};

export const TECNOLOGIAS: Tecnologia[] = [
  { nombre: 'React Native', uso: 'Interfaz nativa con componentes de React', logo: 'react', capa: 'App móvil' },
  { nombre: 'Expo', uso: 'SDK 58, Expo Router y módulo nativo local', logo: 'expo', capa: 'App móvil' },
  { nombre: 'TypeScript', uso: 'Lenguaje de la app', logo: 'typescript', capa: 'App móvil' },
  { nombre: 'Kotlin', uso: 'Servicio HCE (HostApduService)', logo: 'kotlin', capa: 'App móvil' },
  { nombre: 'Android', uso: 'Host Card Emulation', logo: 'android', capa: 'App móvil' },
  { nombre: 'NFC', uso: 'ISO 14443-4 + comandos APDU', logo: 'nfc', capa: 'Sistema de acceso' },
  { nombre: 'Arduino', uso: 'Firmware del escáner', logo: 'arduino', capa: 'Sistema de acceso' },
  { nombre: 'Espressif ESP32', uso: 'Arduino Nano ESP32 con Wi-Fi', logo: 'espressif', capa: 'Sistema de acceso' },
  { nombre: 'Node.js', uso: 'Servidor del sistema de acceso', logo: 'nodedotjs', capa: 'Sistema de acceso' },
  { nombre: 'Express', uso: 'Endpoint /api/scanner y panel', logo: 'express', capa: 'Sistema de acceso' },
  { nombre: 'MySQL', uso: 'Usuarios y estado (active / banned)', logo: 'mysql', capa: 'Sistema de acceso' },
  { nombre: 'SHA-256', uso: 'Resumen de la contraseña antes de enviarla', logo: null, capa: 'Sistema de acceso' },
  { nombre: 'Android Studio', uso: 'SDK, emulador y compilación', logo: 'androidstudio', capa: 'Herramientas' },
  { nombre: 'GitHub', uso: 'Repositorio del proyecto', logo: 'github', capa: 'Herramientas' },
];
