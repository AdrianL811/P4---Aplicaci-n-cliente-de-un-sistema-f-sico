import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { almacen } from './almacen';
import type { Usuario } from './api';
import { borrarCredencial, registrarCredencial } from './hce';

const CLAVE = 'umbral.sesion';
/** Si el almacén cifrado no responde en este tiempo, se continúa como si no hubiera sesión. */
const ESPERA_MAX_MS = 4000;

function conLimite<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<T>((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), ms)),
  ]);
}

/** Las llamadas al módulo NFC nunca deben impedir que la app arranque. */
function seguro(paso: string, fn: () => unknown) {
  try {
    fn();
  } catch (e) {
    console.log(`[Umbral] nfc: fallo en ${paso}`, String(e));
  }
}

type Sesion = {
  usuario: Usuario | null;
  cargando: boolean;
  iniciar: (u: Usuario) => Promise<void>;
  cerrar: () => Promise<void>;
  actualizarFoto: (url: string) => Promise<void>;
};

const SesionContext = createContext<Sesion | null>(null);

/**
 * Guarda el usuario (nunca la contraseña) en el almacén cifrado del sistema para que la
 * credencial siga disponible al reabrir la app, y sincroniza el ID con el servicio HCE.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      console.log('[Umbral] sesion: leyendo almacen');
      try {
        const guardado = await conLimite(almacen.leer(CLAVE), ESPERA_MAX_MS);
        console.log('[Umbral] sesion: leido', guardado ? 'con sesion' : 'sin sesion');
        if (guardado) {
          const u = JSON.parse(guardado) as Usuario;
          seguro('registrar', () => registrarCredencial(u.id));
          setUsuario(u);
        } else {
          seguro('borrar', () => borrarCredencial());
        }
      } catch (e) {
        console.log('[Umbral] sesion: error', String(e));
        await almacen.borrar(CLAVE).catch(() => {});
      } finally {
        console.log('[Umbral] sesion: cargando=false');
        setCargando(false);
      }
    })();
  }, []);

  const iniciar = useCallback(async (u: Usuario) => {
    seguro('registrar', () => registrarCredencial(u.id));
    await almacen.guardar(CLAVE, JSON.stringify(u));
    setUsuario(u);
  }, []);

  const cerrar = useCallback(async () => {
    seguro('borrar', () => borrarCredencial());
    await almacen.borrar(CLAVE);
    setUsuario(null);
  }, []);

  const actualizarFoto = useCallback(
    async (url: string) => {
      if (!usuario) return;
      const u = { ...usuario, fotoUrl: url };
      await almacen.guardar(CLAVE, JSON.stringify(u));
      setUsuario(u);
    },
    [usuario],
  );

  const valor = useMemo(() => ({ usuario, cargando, iniciar, cerrar, actualizarFoto }), [usuario, cargando, iniciar, cerrar, actualizarFoto]);
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion(): Sesion {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return ctx;
}
