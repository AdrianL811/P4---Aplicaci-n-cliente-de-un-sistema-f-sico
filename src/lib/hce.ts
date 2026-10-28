import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import CredencialHce, {
  type HceStatus,
  type ScannerDetectedEvent,
  type ScannerLostEvent,
} from '../../modules/credencial-hce';
import { NFC } from './config';

/** false en Expo Go / web: el módulo nativo sólo existe en el build (npx expo run:android o EAS). */
export const hceDisponible = CredencialHce != null;
console.log('[Umbral] hce: modulo nativo', hceDisponible ? 'disponible' : 'NO disponible');

const SIN_MODULO: HceStatus = {
  hasNfc: false,
  hasHce: false,
  nfcEnabled: false,
  isDefaultForAid: null,
  aid: NFC.aid,
  userId: null,
  byteOrder: NFC.byteOrder,
  payloadHex: null,
};

export function leerEstado(): HceStatus {
  try {
    return CredencialHce?.getStatus() ?? SIN_MODULO;
  } catch {
    return SIN_MODULO;
  }
}

/** Guarda el ID que se enviará al lector. Devuelve los bytes en hexadecimal ("19 00 00 00"). */
export function registrarCredencial(id: number, orden: 'LE' | 'BE' = NFC.byteOrder): string | null {
  return CredencialHce?.setUserId(id, orden) ?? null;
}

export function borrarCredencial() {
  CredencialHce?.clearUserId();
}

export function abrirAjustesNfc() {
  CredencialHce?.openNfcSettings();
}

export function prioridadEnPrimerPlano(activa: boolean) {
  try {
    CredencialHce?.setForegroundPreferred(activa);
  } catch {
    // no es crítico: sin prioridad Android igual enruta el AID si sólo esta app lo registra
  }
}

/** Estado del NFC; se vuelve a leer cuando la app regresa al frente (p. ej. tras encender el NFC). */
export function useEstadoNfc() {
  const [estado, setEstado] = useState<HceStatus>(leerEstado);
  const refrescar = useCallback(() => setEstado(leerEstado()), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refrescar());
    return () => sub.remove();
  }, [refrescar]);
  return { estado, refrescar };
}

export function useEventosLector(
  alDetectar: (e: ScannerDetectedEvent) => void,
  alPerder?: (e: ScannerLostEvent) => void,
) {
  useEffect(() => {
    if (!CredencialHce) return;
    const a = CredencialHce.addListener('onScannerDetected', alDetectar);
    const b = CredencialHce.addListener('onScannerLost', (e) => alPerder?.(e));
    return () => {
      a.remove();
      b.remove();
    };
  }, [alDetectar, alPerder]);
}
