// app/Main/recyclingGuide/_layout.js
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

export default function RecyclingGuideLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#F0F1C5" },
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
      }}
    >
      {/* Main Steps & Benefits page */}
      <Stack.Screen
        name="guides"
        options={{
          title: "Guides",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Do's & Don'ts page */}
      <Stack.Screen
        name="dosDonts"
        options={{
          title: "Guidelines",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
