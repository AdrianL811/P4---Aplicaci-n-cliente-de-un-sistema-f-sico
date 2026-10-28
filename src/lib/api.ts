import * as Crypto from 'expo-crypto';
import { API } from './config';

/** Usuario autenticado, ya normalizado (la API mezcla firstname / first_name, http / https…). */
export type Usuario = {
  id: number;
  username: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  fotoUrl: string;
};

/** Error con un mensaje listo para mostrarse al usuario (heurística 9 de Nielsen). */
export class ApiError extends Error {
  constructor(message: string, readonly tipo: 'credenciales' | 'red' | 'servidor' | 'datos') {
    super(message);
  }
}

/** La API devuelve los errores con HTTP 200 dentro del JSON: { "error": "Failed to login" } */
const MENSAJES: Record<string, { texto: string; tipo: ApiError['tipo'] }> = {
  'Failed to login': { texto: 'Usuario o contraseña incorrectos.', tipo: 'credenciales' },
  'Data missing': { texto: 'Escribe tu usuario y tu contraseña.', tipo: 'datos' },
  Unauthorized: { texto: 'El servidor rechazó el token de la app. Avisa al equipo de desarrollo.', tipo: 'servidor' },
  'Data must be sent in POST': { texto: 'Error interno de la app (método HTTP). Avisa al equipo.', tipo: 'servidor' },
};

/** La API espera la contraseña como SHA-256 en hexadecimal y en minúsculas. */
export async function sha256(texto: string): Promise<string> {
  const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, texto);
  return hex.toLowerCase();
}

/** Android bloquea el tráfico http en claro; las fotos del servidor también existen por https. */
export function urlSegura(url: string | null | undefined): string {
  if (!url) return API.defaultPfp;
  return url.replace(/^http:\/\//i, 'https://');
}

async function peticion(ruta: string, init: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API.baseUrl}/${ruta}`, { ...init, signal: controller.signal });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder. Intenta de nuevo.', 'red');
    }
    throw new ApiError('Sin conexión. Revisa tu Wi-Fi o datos móviles e intenta de nuevo.', 'red');
  } finally {
    clearTimeout(timer);
  }

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`El servidor respondió algo inesperado (HTTP ${res.status}).`, 'servidor');
  }

  if (typeof json.error === 'string') {
    const conocido = MENSAJES[json.error];
    throw new ApiError(conocido?.texto ?? `El servidor respondió: ${json.error}`, conocido?.tipo ?? 'servidor');
  }
  if (!res.ok) {
    throw new ApiError(`El servidor respondió con error HTTP ${res.status}.`, 'servidor');
  }
  return json;
}

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
}

function aUsuario(json: Record<string, unknown>): Usuario {
  const id = Number(json.id);
  if (!Number.isInteger(id) || id < 0 || id > 0xffffffff) {
    throw new ApiError('La respuesta del servidor no trae un número de usuario válido.', 'servidor');
  }
  return {
    id,
    username: texto(json.username),
    nombre: texto(json.firstname ?? json.first_name),
    apellidos: texto(json.lastname ?? json.last_name),
    email: texto(json.email) || null,
    fotoUrl: urlSegura(texto(json.pfp_url) || null),
  };
}

/** POST /login  (x-www-form-urlencoded): user, pass = SHA-256(contraseña), token */
export async function login(usuario: string, contrasena: string): Promise<Usuario> {
  const cuerpo = new URLSearchParams({
    user: usuario.trim(),
    pass: await sha256(contrasena),
    token: API.token,
  });
  const json = await peticion('login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: cuerpo.toString(),
  });
  return aUsuario(json);
}

/** POST /setpfp  (multipart/form-data): token, id, image. Devuelve la nueva URL de la foto. */
export async function cambiarFoto(id: number, uri: string, mimeType?: string | null): Promise<string> {
  const tipo = mimeType ?? 'image/jpeg';
  const extension = tipo.split('/')[1] ?? 'jpg';
  const form = new FormData();
  form.append('token', API.token);
  form.append('id', String(id));
  // En React Native un archivo se adjunta como { uri, name, type }
  form.append('image', { uri, name: `pfp_${id}.${extension}`, type: tipo } as unknown as Blob);

  const json = await peticion('setpfp', { method: 'POST', headers: { Accept: 'application/json' }, body: form });
  const url = urlSegura(texto(json.pfp_url) || null);
  // El servidor puede reutilizar el mismo nombre de archivo: evitamos la caché de la imagen anterior
  return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
}
