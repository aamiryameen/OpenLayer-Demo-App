
import React from 'react';
import { StyleSheet, View } from 'react-native';

import MapScreen from './src/screens/MapScreen';

const App = () => {
  return (
    <View style={styles.root}>
      <MapScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
