import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function Filters({ nonStop, setNonStop }: any) {
  return (
    <View style={styles.row}>
      <Text>Non-stop only</Text>
      <Switch value={nonStop} onValueChange={setNonStop} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 } });
