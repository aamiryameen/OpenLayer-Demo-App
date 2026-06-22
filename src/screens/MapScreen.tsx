/**
 * MapScreen — renders the OpenLayers basic map full-screen.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MapView } from '../map';

export default function MapScreen() {
  return (
    <View style={styles.root}>
      <MapView style={styles.map} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
});
