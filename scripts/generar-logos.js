/**
 * Genera src/data/logos.generated.ts con los logotipos oficiales de cada tecnología.
 * Fuente: paquete npm "simple-icons" (licencia CC0), que distribuye los íconos de marca
 * con su trazo SVG y color oficial. Así la app no depende de internet para mostrarlos.
 *
 *   node scripts/generar-logos.js
 */
const fs = require('fs');
const path = require('path');
const si = require('simple-icons');

const slugs = [
  'siReact', 'siExpo', 'siTypescript', 'siKotlin', 'siAndroid', 'siNfc',
  'siNodedotjs', 'siExpress', 'siMysql', 'siArduino', 'siEspressif', 'siGithub', 'siAndroidstudio',
];

const logos = {};
for (const key of slugs) {
  const icon = si[key];
  if (!icon) throw new Error(`No existe ${key} en simple-icons`);
  logos[icon.slug] = { title: icon.title, hex: `#${icon.hex}`, path: icon.path };
}

const out = `// Archivo generado por scripts/generar-logos.js — no editar a mano.
// Logotipos de simple-icons v${JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'simple-icons', 'package.json'), 'utf8')).version} (CC0). Las marcas pertenecen a sus dueños.
export type BrandLogo = { title: string; hex: string; path: string };
export const LOGOS = ${JSON.stringify(logos, null, 2)} as const satisfies Record<string, BrandLogo>;
export type LogoSlug = keyof typeof LOGOS;
`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'logos.generated.ts'), out);
console.log('Logos generados:', Object.keys(logos).join(', '));
