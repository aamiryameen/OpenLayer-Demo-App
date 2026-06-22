/**
 * Public API of the map module. Import from 'src/map' (or relative) rather
 * than reaching into internal files, so internals can evolve freely as more
 * OpenLayers features are added.
 */
export { default as MapView } from './components/MapView';
export type { MapViewProps } from './components/MapView';
