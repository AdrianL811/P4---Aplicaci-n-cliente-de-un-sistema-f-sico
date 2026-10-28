import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SesionProvider } from '../lib/session';
import { colors } from '../theme';

// Expo Router oculta la pantalla de bienvenida en cuanto dibuja la primera pantalla.
// No la retenemos a mano: si algo tardara (p. ej. el almacén cifrado), la app no se queda en el logo.
console.log('[Umbral] layout: modulo cargado');

export const unstable_settings = { anchor: 'index' };

function Navegacion() {
  // Respaldo: si por cualquier motivo la bienvenida sigue visible a los 3 s, se oculta.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        SplashScreen.hide();
      } catch {}
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="credencial" options={{ animation: 'fade' }} />
      <Stack.Screen name="creditos" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SesionProvider>
        <StatusBar style="dark" />
        <Navegacion />
      </SesionProvider>
    </SafeAreaProvider>
  );
}
