const locationSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
  '<circle cx="16" cy="16" r="7" fill="#1e63ff" stroke="#fff" stroke-width="2"/>' +
  '</svg>';

const markerStyle = new ol.style.Style({
  image: new ol.style.Icon({
    src: window.MARKER_ICON,
    anchor: [0.5, 1], 
    scale: 40 / 512,
  }),
});

const polygonStyle = new ol.style.Style({
  fill: new ol.style.Fill({ color: 'rgba(30, 99, 255, 0.2)' }),
  stroke: new ol.style.Stroke({ color: '#1e63ff', width: 2 }),
});

const inspectionStyle = (feature) => {
  const type = feature.getGeometry().getType();
  return type === 'Point' || type === 'MultiPoint' ? markerStyle : polygonStyle;
};

const source = new ol.source.Vector({
  features: new ol.format.GeoJSON().readFeatures(window.INSPECTIONS_GEOJSON, {
    featureProjection: 'EPSG:3857',
  }),
});


const INSPECTION_CENTER = [-85.7585, 38.2527];
const inspectionOffsets = source.getFeatures().map((feature) => {
  const [lon, lat] = ol.proj.toLonLat(feature.getGeometry().getCoordinates());
  return { feature, dLon: lon - INSPECTION_CENTER[0], dLat: lat - INSPECTION_CENTER[1] };
});
let inspectionsMoved = false;

function placeInspectionsAround(lon, lat) {
  inspectionOffsets.forEach(({ feature, dLon, dLat }) => {
    feature.getGeometry().setCoordinates(ol.proj.fromLonLat([lon + dLon, lat + dLat]));
  });
  inspectionsMoved = true;
}

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


const draw = new ol.interaction.Draw({
  type: 'Polygon',
  source: source,
});
draw.setActive(false); 
const drawButton = document.createElement('div');
drawButton.className = 'ol-control draw-toggle';
drawButton.style.cssText = 'top:9.5em;left:.5em;';
drawButton.innerHTML = '<button title="Draw a polygon">✎</button>';
drawButton.addEventListener('click', () => {
  const active = !draw.getActive();
  draw.setActive(active);
  drawButton.firstChild.style.background = active ? '#1e63ff' : '';
  drawButton.firstChild.style.color = active ? '#fff' : '';
});
map.addControl(new ol.control.Control({ element: drawButton }));

map.addInteraction(draw);

const statusEl = document.createElement('div');
statusEl.style.cssText =
  'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:1000;' +
  'background:rgba(0,0,0,.7);color:#fff;font:12px sans-serif;padding:4px 10px;border-radius:12px;';
statusEl.textContent = 'Locating…';
document.body.appendChild(statusEl);
const setStatus = (t) => { statusEl.textContent = t; };

const positionSource = new ol.source.Vector();



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

  const justMoved = !inspectionsMoved;
  if (justMoved) {
    placeInspectionsAround(lon, lat);
  }
  const circle = ol.geom.Polygon.circular(coords, accuracy || 20);
  positionSource.clear(true);
  positionSource.addFeatures([
    new ol.Feature(circle.transform('EPSG:4326', map.getView().getProjection())),
    new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(coords))),
  ]);
  if (recenter) {
    if (justMoved) {
      map.getView().fit(source.getExtent(), {
        padding: [60, 60, 60, 60],
        duration: 500,
        maxZoom: 15,
      });
    } else {
      map.getView().animate({ center: ol.proj.fromLonLat(coords), zoom: 14, duration: 500 });
    }
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
