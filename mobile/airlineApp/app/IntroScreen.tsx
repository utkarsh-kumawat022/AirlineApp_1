import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";

export default function IntroScreen() {
  const fade = new Animated.Value(0);
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      router.replace("/(tabs)");
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: fade }]}>
        ✈️ Mavericks
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fade }]}>
        Smart Flight Booking Companion
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A23",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    color: "white",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    color: "#ddd",
  },
});
