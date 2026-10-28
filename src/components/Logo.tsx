import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Logotipo original de Umbral: gafete clínico que emite ondas sin contacto. */
export function Logo({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Logotipo de Umbral">
      <Defs>
        <LinearGradient id="umbralGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#14B8A6" />
          <Stop offset="1" stopColor="#0B3B5C" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" rx="24" fill="url(#umbralGrad)" />
      <Rect x="19" y="20" width="42" height="60" rx="8" fill="#FFFFFF" />
      <Rect x="33" y="25.5" width="14" height="3.6" rx="1.8" fill="#0B3B5C" />
      <Rect x="36.5" y="34" width="7" height="21" rx="1.6" fill="#0F9F94" />
      <Rect x="29.5" y="41" width="21" height="7" rx="1.6" fill="#0F9F94" />
      <Rect x="28" y="62" width="24" height="4.2" rx="2.1" fill="#0B3B5C" fillOpacity={0.55} />
      <Rect x="31.5" y="69.5" width="17" height="3.6" rx="1.8" fill="#0B3B5C" fillOpacity={0.3} />
      <Path d="M69.5 42.5 A10 10 0 0 1 69.5 57.5" fill="none" stroke="#FFFFFF" strokeWidth={4.2} strokeLinecap="round" />
      <Path d="M75.5 37 A18 18 0 0 1 75.5 63" fill="none" stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={4.2} strokeLinecap="round" />
      <Path d="M81.5 31.5 A26 26 0 0 1 81.5 68.5" fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={4.2} strokeLinecap="round" />
    </Svg>
  );
}
