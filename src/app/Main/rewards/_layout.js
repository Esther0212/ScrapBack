import { Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function RewardsLayout() {
  const router = useRouter();

  return (
    <Stack
      // Default for ALL profile screens
      screenOptions={{
        headerStyle: { backgroundColor: "#F0F1C5" },
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Redeem Rewards",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="rice"
        options={{
          title: "List of Rice Rewards",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="rice_description"
        options={{
          title: "Rice Offer",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="load"
        options={{
          title: "List of Load Offers",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="load_description"
        options={{
          title: "Load Offer",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="gcash"
        options={{
          title: "List of Gcash Offers",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="gcash_description"
        options={{
          title: "Gcash Offer",
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
