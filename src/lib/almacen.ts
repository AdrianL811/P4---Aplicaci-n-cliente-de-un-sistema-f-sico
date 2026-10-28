import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * En Android/iOS se usa el almacén cifrado del sistema (Keystore / Keychain).
 * En la vista previa web no existe, así que se usa localStorage sólo para diseñar la interfaz.
 */
const web = Platform.OS === 'web';

export const almacen = {
  leer: (clave: string): Promise<string | null> =>
    web ? Promise.resolve(globalThis.localStorage?.getItem(clave) ?? null) : SecureStore.getItemAsync(clave),
  guardar: (clave: string, valor: string): Promise<void> =>
    web ? Promise.resolve(globalThis.localStorage?.setItem(clave, valor)) : SecureStore.setItemAsync(clave, valor),
  borrar: (clave: string): Promise<void> =>
    web ? Promise.resolve(globalThis.localStorage?.removeItem(clave)) : SecureStore.deleteItemAsync(clave),
};
