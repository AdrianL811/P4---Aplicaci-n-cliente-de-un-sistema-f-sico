import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Logo } from '../components/Logo';
import { Boton } from '../components/Boton';
import { NfcPulse } from '../components/NfcPulse';
import { ApiError, cambiarFoto } from '../lib/api';
import { APP, NFC } from '../lib/config';
import {
  abrirAjustesNfc,
  hceDisponible,
  prioridadEnPrimerPlano,
  registrarCredencial,
  useEstadoNfc,
  useEventosLector,
} from '../lib/hce';
import { useSesion } from '../lib/session';
import type { ScannerDetectedEvent } from '../../modules/credencial-hce';
import { colors, fonts, radius } from '../theme';

/** Cuánto tiempo se muestra el aviso "Lector detectado" después de la última lectura */
const AVISO_MS = 4000;

export default function Credencial() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { usuario, cerrar, actualizarFoto } = useSesion();
  const { estado, refrescar } = useEstadoNfc();

  const [ultimo, setUltimo] = useState<ScannerDetectedEvent | null>(null);
  const [lecturas, setLecturas] = useState(0);
  const [avisoVisible, setAvisoVisible] = useState(false);
  const [destello, setDestello] = useState(0);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [diagnostico, setDiagnostico] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mientras esta pantalla esté abierta, Android prefiere a Umbral para el AID del lector
  useEffect(() => {
    prioridadEnPrimerPlano(true);
    return () => {
      prioridadEnPrimerPlano(false);
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  // Retroalimentación: el servicio nativo ya vibró; aquí damos la confirmación visual.
  const alDetectar = useCallback((e: ScannerDetectedEvent) => {
    setUltimo(e);
    setLecturas((n) => n + 1);
    setDestello(Date.now());
    setAvisoVisible(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAvisoVisible(false), AVISO_MS);
  }, []);
  useEventosLector(alDetectar);

  if (!usuario) return <Redirect href="/" />;

  const nombreCompleto = `${usuario.nombre} ${usuario.apellidos}`.trim() || usuario.username;
  const nfcListo = hceDisponible && estado.hasNfc && estado.hasHce && estado.nfcEnabled;

  async function elegirFoto() {
    if (!usuario || subiendoFoto) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.length) return;
    const foto = res.assets[0];
    setSubiendoFoto(true);
    try {
      const url = await cambiarFoto(usuario.id, foto.uri, foto.mimeType);
      await actualizarFoto(url);
    } catch (e) {
      Alert.alert('No se pudo cambiar la foto', e instanceof ApiError ? e.message : 'Intenta de nuevo en unos segundos.');
    } finally {
      setSubiendoFoto(false);
    }
  }

  function confirmarSalida() {
    Alert.alert('Cerrar sesión', 'El teléfono dejará de funcionar como credencial hasta que vuelvas a entrar.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await cerrar();
          router.replace('/');
        },
      },
    ]);
  }

  function cambiarOrden(orden: 'LE' | 'BE') {
    if (!usuario) return;
    registrarCredencial(usuario.id, orden);
    refrescar();
  }

  return (
    <View style={styles.fondo}>
      {/* Barra superior */}
      <View style={[styles.barra, { paddingTop: insets.top + 10 }]}>
        <View style={styles.marca}>
          <Logo size={36} />
          <View>
            <Text style={styles.marcaNombre}>{APP.nombre}</Text>
            <Text style={styles.marcaSector}>{APP.sector}</Text>
          </View>
        </View>
        <Pressable onPress={confirmarSalida} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar sesión">
          <Text style={styles.salir}>Salir</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 28 }]}>
        {/* Gafete */}
        <View style={[styles.gafete, avisoVisible && styles.gafeteActivo]}>
          <LinearGradient colors={['#14B8A6', colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.franja}>
            <View style={styles.ranura} />
            <Text style={styles.franjaTitulo}>CREDENCIAL DIGITAL</Text>
          </LinearGradient>

          <Pressable
            onPress={elegirFoto}
            style={styles.fotoMarco}
            accessibilityRole="button"
            accessibilityLabel="Foto de perfil. Toca para cambiarla"
          >
            <Image source={{ uri: usuario.fotoUrl }} style={styles.foto} contentFit="cover" transition={250} />
            {subiendoFoto ? (
              <View style={styles.fotoCargando}>
                <ActivityIndicator color={colors.white} />
              </View>
            ) : (
              <View style={styles.camara}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
                  <Circle cx={12} cy={13} r={3.5} fill="none" stroke="#fff" strokeWidth={2} />
                </Svg>
              </View>
            )}
          </Pressable>

          <Text style={styles.nombre} accessibilityRole="header">
            {nombreCompleto}
          </Text>
          <Text style={styles.alias}>@{usuario.username}</Text>

          <Pressable onLongPress={() => setDiagnostico((d) => !d)} delayLongPress={600} style={styles.numeroCaja}>
            <Text style={styles.numeroEtiqueta}>NÚMERO DE USUARIO</Text>
            <Text style={styles.numero} accessibilityLabel={`Número de usuario ${usuario.id}`}>
              {usuario.id}
            </Text>
          </Pressable>

          {usuario.email && <Text style={styles.email}>{usuario.email}</Text>}
        </View>

        {/* Estado NFC y retroalimentación del lector */}
        <View style={styles.panel}>
          <EstadoNfc
            nfcListo={nfcListo}
            avisoVisible={avisoVisible}
            destello={destello}
            ultimo={ultimo}
            estado={estado}
          />
          {nfcListo && estado.isDefaultForAid === false && (
            <Text style={styles.advertencia}>
              Otra app del teléfono también responde a este lector (¿la app de ejemplo sigue instalada?). Desinstálala
              o mantén {APP.nombre} abierta al acercarte.
            </Text>
          )}
        </View>

        {diagnostico && (
          <View style={styles.diag}>
            <Text style={styles.diagTitulo}>Diagnóstico NFC</Text>
            <Fila k="AID" v={estado.aid ?? NFC.aid} />
            <Fila k="Bytes del ID" v={estado.payloadHex ?? '—'} />
            <Fila k="Orden" v={estado.byteOrder === 'LE' ? 'Little-endian (ESP32)' : 'Big-endian'} />
            <Fila k="Lecturas" v={String(lecturas)} />
            <Fila k="Último APDU recibido" v={ultimo?.apduIn ?? '—'} />
            <Fila k="Última respuesta" v={ultimo?.apduOut ?? '—'} />
            <View style={styles.diagBotones}>
              {(['LE', 'BE'] as const).map((o) => (
                <Pressable
                  key={o}
                  onPress={() => cambiarOrden(o)}
                  style={[styles.diagBoton, estado.byteOrder === o && styles.diagBotonActivo]}
                >
                  <Text style={[styles.diagBotonTexto, estado.byteOrder === o && { color: colors.white }]}>{o}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 18 }} />
        <Boton titulo="Créditos" variante="secundario" onPress={() => router.push('/creditos')} />
      </ScrollView>
    </View>
  );
}

function EstadoNfc({
  nfcListo,
  avisoVisible,
  destello,
  ultimo,
  estado,
}: {
  nfcListo: boolean;
  avisoVisible: boolean;
  destello: number;
  ultimo: ScannerDetectedEvent | null;
  estado: ReturnType<typeof useEstadoNfc>['estado'];
}) {
  if (!hceDisponible) {
    return <Mensaje titulo="NFC no disponible en esta vista previa" texto="Instala el APK de la app para usar la credencial." />;
  }
  if (!estado.hasNfc) {
    return <Mensaje titulo="Este teléfono no tiene NFC" texto="La credencial necesita un dispositivo con NFC." />;
  }
  if (!estado.hasHce) {
    return <Mensaje titulo="Sin emulación de tarjeta (HCE)" texto="Este teléfono no puede presentarse como credencial NFC." />;
  }
  if (!estado.nfcEnabled) {
    return (
      <View style={{ alignItems: 'center' }}>
        <Mensaje titulo="El NFC está apagado" texto="Enciéndelo para que el lector pueda leer tu credencial." />
        <View style={{ height: 12 }} />
        <Boton titulo="Activar NFC" onPress={abrirAjustesNfc} />
      </View>
    );
  }
  return (
    <View style={styles.estado}>
      <NfcPulse activo={nfcListo} destello={destello} size={112} />
      <View style={{ flex: 1 }}>
        {avisoVisible && ultimo ? (
          <>
            <Text style={[styles.estadoTitulo, { color: colors.success }]} accessibilityLiveRegion="assertive">
              {ultimo.credentialSent ? 'Lector detectado' : 'Lector detectado sin sesión'}
            </Text>
            <Text style={styles.estadoTexto}>
              {ultimo.credentialSent
                ? `Credencial enviada a las ${new Date(ultimo.timestamp).toLocaleTimeString('es-MX')}. Observa la luz del lector.`
                : 'No se envió ningún número.'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.estadoTitulo}>Lista para usarse</Text>
            <Text style={styles.estadoTexto}>Desbloquea el teléfono y acerca la parte trasera al lector.</Text>
          </>
        )}
      </View>
    </View>
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={styles.mensaje}>
      <Text style={styles.mensajeTitulo}>{titulo}</Text>
      <Text style={styles.mensajeTexto}>{texto}</Text>
    </View>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaK}>{k}</Text>
      <Text style={styles.filaV} selectable>
        {v}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.bg },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marcaNombre: { fontSize: 18, fontWeight: '800', color: colors.ink },
  marcaSector: { fontSize: 12, color: colors.inkSoft },
  salir: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  contenido: { padding: 20 },
  gafete: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#0B2236',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  gafeteActivo: { borderColor: colors.primary },
  franja: { alignSelf: 'stretch', height: 112, alignItems: 'center', paddingTop: 14 },
  ranura: { width: 54, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  franjaTitulo: { color: colors.white, fontSize: 12, fontWeight: '800', letterSpacing: 2.5, marginTop: 14 },
  fotoMarco: { marginTop: -58, width: 140, height: 140, borderRadius: 70, borderWidth: 5, borderColor: colors.white, backgroundColor: colors.line },
  foto: { width: '100%', height: '100%', borderRadius: 70 },
  fotoCargando: { ...StyleSheet.absoluteFill, borderRadius: 70, backgroundColor: 'rgba(11,34,54,0.5)', alignItems: 'center', justifyContent: 'center' },
  camara: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: { fontSize: 28, fontWeight: '800', color: colors.ink, textAlign: 'center', marginTop: 14, paddingHorizontal: 20, lineHeight: 34 },
  alias: { fontSize: 15, color: colors.inkSoft, marginTop: 2 },
  numeroCaja: {
    marginTop: 18,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  numeroEtiqueta: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.8 },
  numero: { fontSize: 44, fontWeight: '800', color: colors.primaryDark, fontFamily: fonts.mono, letterSpacing: 2 },
  email: { marginTop: 12, fontSize: 13, color: colors.muted },
  panel: { marginTop: 18, backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.line },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  estadoTitulo: { fontSize: 18, fontWeight: '800', color: colors.ink },
  estadoTexto: { fontSize: 14, color: colors.inkSoft, marginTop: 4, lineHeight: 20 },
  mensaje: { backgroundColor: colors.warningSoft, borderRadius: radius.sm, padding: 14, alignSelf: 'stretch' },
  mensajeTitulo: { fontSize: 16, fontWeight: '800', color: colors.warning },
  mensajeTexto: { fontSize: 14, color: colors.ink, marginTop: 4, lineHeight: 20 },
  advertencia: { marginTop: 12, fontSize: 13, color: colors.warning, lineHeight: 18 },
  diag: { marginTop: 18, backgroundColor: colors.ink, borderRadius: radius.md, padding: 16 },
  diagTitulo: { color: colors.white, fontWeight: '800', fontSize: 15, marginBottom: 8 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 12 },
  filaK: { color: '#9FB3C8', fontSize: 13 },
  filaV: { color: colors.white, fontSize: 13, fontFamily: fonts.mono, flexShrink: 1, textAlign: 'right' },
  diagBotones: { flexDirection: 'row', gap: 10, marginTop: 10 },
  diagBoton: { flex: 1, borderWidth: 1, borderColor: '#9FB3C8', borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  diagBotonActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  diagBotonTexto: { color: '#9FB3C8', fontWeight: '700' },
});
