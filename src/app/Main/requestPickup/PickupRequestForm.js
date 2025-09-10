import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; // merged import

export default function PickupRequestForm() {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [weight, setWeight] = useState('');
  const [pickupDateTime, setPickupDateTime] = useState('');
  const { selectedAddress } = useLocalSearchParams();
  const [pickupAddress, setPickupAddress] = useState(selectedAddress || '');

  const router = useRouter();

  const recyclableTypes = ['Plastic', 'Paper', 'Metal', 'Glass'];

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Type of recyclable</Text>

      <View style={styles.card}>
        <Text style={styles.selectLabel}>Select all that applies</Text>
        {recyclableTypes.map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => toggleType(type)}
            style={[
              styles.option,
              selectedTypes.includes(type) && styles.optionSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selectedTypes.includes(type) && styles.optionTextSelected,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Estimated weight (kg)</Text>
      <TextInput
        style={styles.input}
        placeholder="Value"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <TouchableOpacity style={styles.infoBox}>
        <MaterialIcons name="date-range" size={24} color="green" />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Pickup Date & Time</Text>
          <Text style={styles.infoSub}>{pickupDateTime || "Select Date & Time"}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.infoBox}
        onPress={() => router.push('/MapSelector')} // Make sure this route exists
      >
        <FontAwesome name="map-marker" size={26} color="red" />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Pickup Address</Text>
          <Text style={styles.infoSub}>
            {pickupAddress || 'Select Location on Map'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.requestButton} onPress={() => router.push("Main/requestPickup")}>
        <FontAwesome name="truck" size={18} color="#fff"/>
        <Text style={styles.requestButtonText}>Request Pickup</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F0F0C0',
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#E2F2D6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectLabel: {
    color: '#4C8055',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#DFF6DD',
  },
  optionText: {
    fontSize: 16,
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: '#3B7437',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoSub: {
    color: '#555',
    fontSize: 13,
  },
  requestButton: {
    flexDirection: 'row',
    backgroundColor: '#117D2E',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
