import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { UrlTile, Marker } from "react-native-maps";

export default function MapSelector() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [locationReady, setLocationReady] = useState(false);

  const [region, setRegion] = useState({
    latitude: 8.4542, // fallback: Cagayan de Oro
    longitude: 124.6319,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [marker, setMarker] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
  });

  // Request location permission and current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission not granted. Using default location.');
          setLocationReady(true);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(newRegion);
        setMarker({ latitude, longitude });
        setLocationReady(true);
      } catch (error) {
        console.warn('Location error. Showing default region.');
        setLocationReady(true);
      }
    })();
  }, []);

  // Search for location by name
  const handleSearch = async () => {
    if (!searchText) return;
    try {
      const results = await Location.geocodeAsync(searchText);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setMarker({ latitude, longitude });
        mapRef.current?.animateToRegion(newRegion, 1000);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  if (!locationReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        ref={mapRef}
        onLongPress={e => setMarker(e.nativeEvent.coordinate)}
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
        />
        {marker && <Marker coordinate={marker} />}
      </MapView>

      {/* Top Overlay: Back button + Search */}
      <View style={styles.topOverlay}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.checkMark}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: { marginRight: 10 },
  backButtonText: { fontSize: 28, color: '#333' },
  searchBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  searchInput: { flex: 1, fontSize: 16 },
  checkMark: { fontSize: 20, color: '#117D2E', marginLeft: 8 },
});
