import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Ondas concéntricas que "respiran" mientras la credencial espera al lector.
 * Cuando `destello` cambia, se dispara un pulso fuerte como confirmación visual.
 */
export function NfcPulse({ activo, destello, size = 120 }: { activo: boolean; destello: number; size?: number }) {
  const ondas = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activo) return;
    const loops = ondas.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  useEffect(() => {
    if (!destello) return;
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [destello, flash]);

  const color = activo ? colors.primary : colors.muted;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {ondas.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.onda,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: color,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }],
            },
          ]}
        />
      ))}
      <Animated.View
        style={[
          styles.onda,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
            borderWidth: 0,
            opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
            transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.6] }) }],
          },
        ]}
      />
      <View style={[styles.centro, { backgroundColor: activo ? colors.primary : colors.muted }]}>
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <Path d="M6 7.5a6.5 6.5 0 0 1 0 9" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          <Path d="M10 5a10 10 0 0 1 0 14" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          <Path d="M14 2.8a13.5 13.5 0 0 1 0 18.4" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  onda: { position: 'absolute', borderWidth: 2 },
  centro: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
