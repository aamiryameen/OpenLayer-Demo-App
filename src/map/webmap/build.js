
const fs = require('fs');
const path = require('path');

const dir = __dirname;

const olDir = path.dirname(require.resolve('ol/package.json'));
const olCss = fs.readFileSync(path.join(olDir, 'ol.css'), 'utf8');
const olJs = fs.readFileSync(path.join(olDir, 'dist', 'ol.js'), 'utf8');
const main = fs.readFileSync(path.join(dir, 'main.js'), 'utf8');

const geojson = fs.readFileSync(
  path.join(dir, '..', '..', 'data', 'inspections.json'),
  'utf8',
);

const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>OpenLayers</title>
    <style>
${olCss}
    </style>
    <style>
      html, body, #map-container {
        margin: 0;
        height: 100%;
        width: 100%;
        font-family: sans-serif;
      }
      /* Keep map controls below the status bar / notch so the top button
         (zoom-in) isn't covered by the safe-area and stays tappable. */
      .ol-zoom { top: calc(.5em + env(safe-area-inset-top)) !important; }
      .ol-control.locate { top: calc(6em + env(safe-area-inset-top)) !important; }
    </style>
  </head>
  <body>
    <div id="map-container"></div>
    <script>
${olJs}
    </script>
    <script>
      window.INSPECTIONS_GEOJSON = ${geojson};
    </script>
    <script>
${main}
    </script>
  </body>
</html>
`;

const ts = `/* eslint-disable */
/**
 * GENERATED FILE — do not edit by hand.
 * Produced by webmap/build.js. Regenerate with: npm run build:map
 */
export const MAP_HTML: string = ${JSON.stringify(html)};
`;

const out = path.join(dir, '..', 'html', 'mapHtml.ts');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, ts, 'utf8');
console.log('Wrote', out, '(' + (ts.length / 1024).toFixed(0) + ' KB)');
