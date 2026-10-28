import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LOGOS, type LogoSlug } from '../data/logos.generated';
import { colors } from '../theme';

/** Logotipo oficial (simple-icons, viewBox 24×24) con el color de la marca. */
export function TechLogo({ slug, size = 28, fallback = '#' }: { slug: LogoSlug | null; size?: number; fallback?: string }) {
  if (!slug) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 4 }]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.5 }]}>{fallback}</Text>
      </View>
    );
  }
  const logo = LOGOS[slug];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel={`Logotipo de ${logo.title}`}>
      <Path d={logo.path} fill={logo.hex} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.white, fontWeight: '800' },
});
