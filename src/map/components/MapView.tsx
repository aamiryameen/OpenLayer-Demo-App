import React, { useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';

import { MAP_HTML } from '../html/mapHtml';

export interface MapViewProps {
  style?: ViewStyle;
}

export default function MapView({ style }: MapViewProps) {
  const webviewRef = useRef<WebView>(null);
  const watchId = useRef<number | null>(null);

  const inject = (js: string) => {
    webviewRef.current?.injectJavaScript(`${js}; true;`);
  };

  const pushPosition = (
    pos: { coords: { longitude: number; latitude: number; accuracy: number } },
    recenter: boolean,
  ) => {
    const { longitude, latitude, accuracy } = pos.coords;
    inject(
      `window.setUserLocation && window.setUserLocation(${longitude}, ${latitude}, ${accuracy}, ${recenter})`,
    );
  };
  const pushError = (err: { message: string }) => {
    inject(
      `window.setLocationStatus && window.setLocationStatus(${JSON.stringify(
        'Location error: ' + err.message,
      )})`,
    );
  };

  const locateOnce = (recenter: boolean) => {
    inject(`window.setLocationStatus && window.setLocationStatus('Locating…')`);
    Geolocation.getCurrentPosition((p) => pushPosition(p, recenter), pushError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  };

  const startTracking = () => {
    locateOnce(true);
    watchId.current = Geolocation.watchPosition(
      (p) => pushPosition(p, false),
      pushError,
      { enableHighAccuracy: true, distanceFilter: 0, interval: 5000 },
    );
  };

  const onMessage = (e: { nativeEvent: { data: string } }) => {
    if (e.nativeEvent.data === 'locate') {
      locateOnce(true);
    }
  };

  const requestAndTrack = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        inject(`window.setLocationStatus && window.setLocationStatus('Permission denied')`);
        return;
      }
      startTracking();
    } else {
      Geolocation.requestAuthorization(
        () => {
          startTracking();
        },
        () =>
          inject(`window.setLocationStatus && window.setLocationStatus('Permission denied')`),
      );
    }
  };

  useEffect(() => {
    return () => {
      if (watchId.current != null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webviewRef}
        source={{ html: MAP_HTML }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={requestAndTrack}
        onMessage={onMessage}
        style={styles.webview}
        webviewDebuggingEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#f2f2f2' },
});
