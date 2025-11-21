import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AIRLINE_NAMES } from '../constants/airlines';

export default function FlightCard({ offer, onPress }: any) {
  const firstSegment = offer.itineraries[0].segments[0];
  const lastSegments = offer.itineraries[offer.itineraries.length - 1].segments;
  const lastSegment = lastSegments[lastSegments.length - 1];
  const airlineCode = firstSegment.carrierCode;
  const airline = AIRLINE_NAMES[airlineCode] || airlineCode;
  const dep = firstSegment.departure.iataCode;
  const arr = lastSegment.arrival.iataCode;
  const price = offer.price?.total_in_inr;
  const stops = offer.itineraries[0].segments.length - 1;
  const departureTime = firstSegment.departure.at;
  const arrivalTime = lastSegment.arrival.at;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(offer)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.title}>{airline}</Text>
        <Text style={styles.price}>₹ {Number(price).toFixed(2)}</Text>
      </View>
      <Text style={styles.route}>{dep} → {arr} • {stops} stops</Text>
      <Text style={styles.times}>{departureTime?.slice(11,16)} - {arrivalTime?.slice(11,16)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, marginVertical: 8, borderRadius: 12, backgroundColor: 'white', elevation: 2 },
  title: { fontWeight: '700', fontSize: 16 },
  price: { fontWeight: '700', fontSize: 16, color: 'green' },
  route: { color: '#444', marginTop: 6 },
  times: { color: '#666', marginTop: 4 }
});
