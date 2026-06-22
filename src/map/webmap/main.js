/* eslint-disable no-undef, no-new */

const markerSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">' +
  '<path fill="#d9a528" stroke="#fff" stroke-width="2" d="M16 1C8 1 2 7 2 15c0 9 14 24 14 24s14-15 14-24C30 7 24 1 16 1z"/>' +
  '<g fill="#fff" transform="translate(9 8)">' +
  '<path d="M3 0l3 3-3 3-3-3z"/><rect x="1.5" y="5" width="2" height="9"/>' +
  '<path d="M11 0l3 3-3 3-3-3z"/><rect x="9.5" y="5" width="2" height="9"/>' +
  '</g></svg>';

const inspectionStyle = new ol.style.Style({
  image: new ol.style.Icon({
    src: 'data:image/svg+xml;utf8,' + encodeURIComponent(markerSvg),
    anchor: [0.5, 1],
  }),
});

const source = new ol.source.Vector({
  features: new ol.format.GeoJSON().readFeatures(window.INSPECTIONS_GEOJSON, {
    featureProjection: 'EPSG:3857',
  }),
});

const map = new ol.Map({
  target: 'map-container',
  layers: [
    new ol.layer.Tile({ source: new ol.source.OSM() }),
    new ol.layer.Vector({ source, style: inspectionStyle }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([-85.7585, 38.2527]),
    zoom: 9,
  }),
});

map.addInteraction(new ol.interaction.Link());

const statusEl = document.createElement('div');
statusEl.style.cssText =
  'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:1000;' +
  'background:rgba(0,0,0,.7);color:#fff;font:12px sans-serif;padding:4px 10px;border-radius:12px;';
statusEl.textContent = 'Locating…';
document.body.appendChild(statusEl);
const setStatus = (t) => { statusEl.textContent = t; };

const positionSource = new ol.source.Vector();

const locationSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
  '<circle cx="16" cy="16" r="7" fill="#1e63ff" stroke="#fff" stroke-width="2"/>' +
  '</svg>';

const locationIcon = new ol.style.Icon({
  src: 'data:image/svg+xml;utf8,' + encodeURIComponent(locationSvg),
});

const positionStyle = new ol.style.Style({
  fill: new ol.style.Fill({ color: 'rgba(30, 99, 255, 0.2)' }),
  image: locationIcon,
});

new ol.layer.Vector({ map, source: positionSource, style: positionStyle });

let lastCoords = null;

window.setUserLocation = function (lon, lat, accuracy, recenter) {
  setStatus('Location found');
  const coords = [lon, lat];
  lastCoords = coords;
  const circle = ol.geom.Polygon.circular(coords, accuracy || 20);
  positionSource.clear(true);
  positionSource.addFeatures([
    new ol.Feature(circle.transform('EPSG:4326', map.getView().getProjection())),
    new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(coords))),
  ]);
  if (recenter) {
    map.getView().animate({ center: ol.proj.fromLonLat(coords), zoom: 14, duration: 500 });
  }
};

window.setLocationStatus = function (msg) {
  setStatus(msg);
};

function requestLocation() {
  setStatus('Locating…');
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage('locate');
  }
}

const locate = document.createElement('div');
locate.className = 'ol-control locate';
locate.style.cssText = 'top:6em;left:.5em;';
locate.innerHTML = '<button title="Show my location">◎</button>';
locate.addEventListener('click', () => {
  if (lastCoords) {
    map.getView().animate({ center: ol.proj.fromLonLat(lastCoords), zoom: 14, duration: 500 });
  }
  requestLocation();
});
map.addControl(new ol.control.Control({ element: locate }));
