import { NativeModule, requireOptionalNativeModule } from 'expo';

export type ByteOrder = 'LE' | 'BE';

export type HceStatus = {
  /** El teléfono tiene chip NFC */
  hasNfc: boolean;
  /** El teléfono soporta Host Card Emulation (emular una tarjeta) */
  hasHce: boolean;
  /** El usuario tiene el NFC encendido en Ajustes */
  nfcEnabled: boolean;
  /** false si otra app (p. ej. la app de ejemplo) también reclama el AID */
  isDefaultForAid: boolean | null;
  aid: string;
  userId: number | null;
  byteOrder: ByteOrder;
  /** Los 4 bytes que se enviarán, en hexadecimal: "19 00 00 00" */
  payloadHex: string | null;
};

export type ScannerDetectedEvent = {
  credentialSent: boolean;
  userId: number | null;
  apduIn: string;
  apduOut: string;
  timestamp: number;
};

export type ScannerLostEvent = {
  reason: 'link_loss' | 'deselected';
  timestamp: number;
};

type CredencialHceEvents = {
  onScannerDetected(event: ScannerDetectedEvent): void;
  onScannerLost(event: ScannerLostEvent): void;
};

declare class CredencialHceModule extends NativeModule<CredencialHceEvents> {
  getStatus(): HceStatus;
  setUserId(id: number, byteOrder?: ByteOrder | null): string;
  clearUserId(): void;
  setForegroundPreferred(enabled: boolean): void;
  openNfcSettings(): void;
}

/**
 * Es "opcional" para que la interfaz pueda abrirse en Expo Go o en web mientras se diseña.
 * En ese caso vale null y la app avisa que necesita el build nativo.
 */
export default requireOptionalNativeModule<CredencialHceModule>('CredencialHce');
