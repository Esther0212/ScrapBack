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
  const [selectedView, setSelectedView] = useState('map');
  const [region, setRegion] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [marker, setMarker] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

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
      } catch (error) {
        console.warn('Location error. Showing default region.');
      }
    })();
  }, []);

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

  return (
    <View style={styles.container}>
      {selectedView === 'map' ? (
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
      ) : (
        <View style={styles.blankListView}>
          <Text style={styles.blankText}>[ Drop-off stations here ]</Text>
        </View>
      )}

      {/* Top Overlay: Search */}
      <View style={styles.topOverlay}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Toggle: Drop-off stations */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[styles.toggleOption, selectedView === 'map' && styles.toggleSelected]}
            onPress={() => setSelectedView('map')}
          >
            <Text
              style={[styles.toggleOptionText, selectedView === 'map' && styles.toggleOptionTextSelected]}
            >
              Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleOption, selectedView === 'list' && styles.toggleSelected]}
            onPress={() => setSelectedView('list')}
          >
            <Text
              style={[styles.toggleOptionText, selectedView === 'list' && styles.toggleOptionTextSelected]}
            >
              List
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toggleLabelBox}>
          <Text style={styles.toggleLabel}>Drop-off stations</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 28,
    color: '#333',
  },
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
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  toggleContainer: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    zIndex: 10,
    alignItems: 'flex-start',
  },
  toggleLabelBox: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 10,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  toggleSelected: {
    backgroundColor: 'white',
  },
  toggleOptionText: {
    fontSize: 16,
    color: '#555',
  },
  toggleOptionTextSelected: {
    color: '#117D2E',
    fontWeight: 'bold',
  },
  blankListView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F1C5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankText: {
    fontSize: 16,
    color: '#aaa',
  },
});