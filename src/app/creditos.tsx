import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { TechLogo } from '../components/TechLogo';
import { APP } from '../lib/config';
import { EQUIPO, TECNOLOGIAS, type Tecnologia } from '../data/equipo';
import { colors, radius } from '../theme';

const CAPAS: Tecnologia['capa'][] = ['App móvil', 'Sistema de acceso', 'Herramientas'];

/** Créditos: integrantes, grupo, fecha y tech stack. Todo es información local. */
export default function Creditos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const regresar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.fondo}>
      <View style={[styles.barra, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={regresar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Regresar">
          <Text style={styles.regresar}>‹ Regresar</Text>
        </Pressable>
        <Text style={styles.barraTitulo}>Créditos</Text>
        <View style={{ width: 84 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.encabezado}>
          <Logo size={72} />
          <Text style={styles.app}>{APP.nombre}</Text>
          <Text style={styles.version}>
            Versión {APP.version} · {APP.lema}
          </Text>
        </View>

        <Text style={styles.seccion}>Desarrollado por</Text>
        <View style={styles.tarjeta}>
          <Text style={styles.equipo}>Equipo {EQUIPO.nombre}</Text>
          {EQUIPO.integrantes.map((m) => (
            <View key={m.nombre} style={styles.integrante}>
              <View style={[styles.avatar, { backgroundColor: m.color }]}>
                <Text style={styles.avatarTexto}>{m.iniciales}</Text>
              </View>
              <Text style={styles.integranteNombre}>{m.nombre}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tarjeta, { marginTop: 12 }]}>
          <Dato k="Materia" v={EQUIPO.materia} />
          <Dato k="Grupo" v={EQUIPO.grupo} />
          <Dato k="Profesor" v={EQUIPO.profesor} />
          <Dato k="Fecha" v={EQUIPO.fecha} />
          <Dato k="Institución" v={EQUIPO.institucion} ultimo />
        </View>

        <Text style={styles.seccion}>Tech stack</Text>
        {CAPAS.map((capa) => (
          <View key={capa} style={{ marginBottom: 14 }}>
            <Text style={styles.capa}>{capa}</Text>
            <View style={styles.rejilla}>
              {TECNOLOGIAS.filter((t) => t.capa === capa).map((t) => (
                <View key={t.nombre} style={styles.tech}>
                  <View style={styles.techLogo}>
                    <TechLogo slug={t.logo} size={30} />
                  </View>
                  <Text style={styles.techNombre}>{t.nombre}</Text>
                  <Text style={styles.techUso}>{t.uso}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.nota}>
          Los logotipos son marcas de sus respectivos propietarios y se muestran sólo para identificar las tecnologías
          utilizadas (íconos de simple-icons, licencia CC0).
        </Text>
      </ScrollView>
    </View>
  );
}

function Dato({ k, v, ultimo }: { k: string; v: string; ultimo?: boolean }) {
  return (
    <View style={[styles.dato, !ultimo && styles.datoLinea]}>
      <Text style={styles.datoK}>{k}</Text>
      <Text style={styles.datoV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.bg },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  regresar: { color: colors.primary, fontSize: 16, fontWeight: '700', width: 84 },
  barraTitulo: { fontSize: 17, fontWeight: '800', color: colors.ink },
  contenido: { padding: 20 },
  encabezado: { alignItems: 'center', marginBottom: 8 },
  app: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 10 },
  version: { fontSize: 13, color: colors.inkSoft, marginTop: 2, textAlign: 'center' },
  seccion: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.line },
  equipo: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  integrante: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: colors.white, fontWeight: '800', fontSize: 15 },
  integranteNombre: { fontSize: 16, color: colors.ink, fontWeight: '600', flexShrink: 1 },
  dato: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, gap: 16 },
  datoLinea: { borderBottomWidth: 1, borderBottomColor: colors.line },
  datoK: { fontSize: 14, color: colors.inkSoft },
  datoV: { fontSize: 14, color: colors.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  capa: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tech: {
    width: '46%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  techLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F6F8FA', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  techNombre: { fontSize: 15, fontWeight: '800', color: colors.ink },
  techUso: { fontSize: 12, color: colors.inkSoft, marginTop: 2, lineHeight: 16 },
  nota: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
