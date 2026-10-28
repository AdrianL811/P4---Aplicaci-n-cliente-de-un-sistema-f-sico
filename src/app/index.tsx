import { useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { Boton } from '../components/Boton';
import { ApiError, login } from '../lib/api';
import { APP } from '../lib/config';
import { hceDisponible } from '../lib/hce';
import { useSesion } from '../lib/session';
import { colors, radius } from '../theme';

/** Pantalla de acceso: usuario + contraseña contra la API de la práctica 2. */
export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { usuario: sesion, cargando: cargandoSesion, iniciar } = useSesion();

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campoContrasena = useRef<ComponentRef<typeof TextInput>>(null);

  console.log('[Umbral] login: render, cargandoSesion =', cargandoSesion, 'sesion =', !!sesion);
  if (cargandoSesion) return <View style={styles.fondo} />;
  if (sesion) return <Redirect href="/credencial" />;

  const listo = usuario.trim().length > 0 && contrasena.length > 0;

  async function entrar() {
    if (!listo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const u = await login(usuario, contrasena);
      await iniciar(u);
      setContrasena('');
      router.replace('/credencial');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#14B8A6', colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cabecera, { paddingTop: insets.top + 36 }]}
        >
          <Logo size={92} />
          <Text style={styles.nombreApp}>{APP.nombre}</Text>
          <Text style={styles.lema}>{APP.lema}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipTexto}>{APP.sector}</Text>
          </View>
        </LinearGradient>

        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>Inicia sesión</Text>
          <Text style={styles.subtitulo}>Usa el usuario y la contraseña que te asignó la institución.</Text>

          <Text style={styles.etiqueta}>Usuario</Text>
          <TextInput
            style={styles.campo}
            value={usuario}
            onChangeText={(t) => {
              setUsuario(t);
              setError(null);
            }}
            placeholder="p. ej. eespinosa"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => campoContrasena.current?.focus()}
            editable={!enviando}
            accessibilityLabel="Usuario"
          />

          <Text style={styles.etiqueta}>Contraseña</Text>
          <View style={styles.campoFila}>
            <TextInput
              ref={campoContrasena}
              style={[styles.campo, styles.campoFlexible]}
              value={contrasena}
              onChangeText={(t) => {
                setContrasena(t);
                setError(null);
              }}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry={!verContrasena}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={entrar}
              editable={!enviando}
              accessibilityLabel="Contraseña"
            />
            <Pressable
              onPress={() => setVerContrasena((v) => !v)}
              style={styles.ver}
              accessibilityRole="button"
              accessibilityLabel={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Text style={styles.verTexto}>{verContrasena ? 'Ocultar' : 'Ver'}</Text>
            </Pressable>
          </View>

          {error && (
            <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Text style={styles.errorTexto}>{error}</Text>
            </View>
          )}

          <View style={{ height: 18 }} />
          <Boton titulo="Entrar" onPress={entrar} disabled={!listo} cargando={enviando} />
        </View>

        {!hceDisponible && (
          <Text style={styles.aviso}>
            Vista previa sin módulo NFC (Expo Go o web). Para usar la credencial instala el APK de la app.
          </Text>
        )}

        <View style={styles.pie}>
          <Boton titulo="Créditos" variante="fantasma" onPress={() => router.push('/creditos')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.bg },
  cabecera: { alignItems: 'center', paddingBottom: 64, paddingHorizontal: 24 },
  nombreApp: { color: colors.white, fontSize: 34, fontWeight: '800', marginTop: 14, letterSpacing: 0.5 },
  lema: { color: '#D7F3EF', fontSize: 15, marginTop: 4, textAlign: 'center' },
  chip: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  chipTexto: { color: colors.white, fontSize: 13, fontWeight: '600' },
  tarjeta: {
    marginTop: -40,
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 22,
    shadowColor: '#0B2236',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: colors.ink },
  subtitulo: { fontSize: 14, color: colors.inkSoft, marginTop: 4, marginBottom: 8, lineHeight: 20 },
  etiqueta: { fontSize: 13, fontWeight: '700', color: colors.inkSoft, marginTop: 14, marginBottom: 6 },
  campo: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: '#FBFDFE',
  },
  campoFila: { justifyContent: 'center' },
  campoFlexible: { paddingRight: 84 },
  ver: { position: 'absolute', right: 6, height: 40, paddingHorizontal: 12, justifyContent: 'center' },
  verTexto: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  error: { marginTop: 14, backgroundColor: colors.dangerSoft, borderRadius: radius.sm, padding: 12, borderLeftWidth: 4, borderLeftColor: colors.danger },
  errorTexto: { color: colors.danger, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  aviso: { marginHorizontal: 28, marginTop: 16, color: colors.warning, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  pie: { marginTop: 12, alignItems: 'center' },
});
