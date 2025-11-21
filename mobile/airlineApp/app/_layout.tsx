import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Appearance } from "react-native";
import IntroScreen from "./IntroScreen"; // ✅ use your file name

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);

  // 🌟 Always Force Light Mode
  useEffect(() => {
    Appearance.setColorScheme("light");

    // ⏳ Hide intro splash after 1.5 seconds
    const timer = setTimeout(() => setShowIntro(false), 1500);

    return () => clearTimeout(timer);
  }, []);

  // ✈️ Show intro screen while loading
  if (showIntro) return <IntroScreen />;

  // 📱 After intro → Load the app normally
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF", // always white background
        },
      }}
    />
  );
}
