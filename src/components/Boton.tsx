import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, radius } from '../theme';

type Variante = 'primario' | 'secundario' | 'fantasma';

type Props = Omit<PressableProps, 'style'> & {
  titulo: string;
  variante?: Variante;
  cargando?: boolean;
};

export function Boton({ titulo, variante = 'primario', cargando, disabled, ...rest }: Props) {
  const inactivo = !!disabled || !!cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: !!cargando }}
      disabled={inactivo}
      style={({ pressed }) => [styles.base, fondo[variante], inactivo && styles.inactivo, pressed && styles.presionado]}
      {...rest}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'primario' ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.etiqueta, variante !== 'primario' && styles.etiquetaSecundaria]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const fondo = StyleSheet.create({
  primario: { backgroundColor: colors.primaryDark },
  secundario: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line },
  fantasma: { backgroundColor: 'transparent', minHeight: 44 },
});

const styles = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  inactivo: { opacity: 0.5 },
  presionado: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  etiqueta: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  etiquetaSecundaria: { color: colors.primaryDark },
});
