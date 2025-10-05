import { Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function RequestPickupLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#F0F1C5" },
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Pickup Requests List",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="PickupRequestForm"
        options={{
          title: "Request a Pickup Schedule",
          headerShown: true,
          headerBackVisible: false, // hide the default back
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="ArchivedRequests"
        options={{
          title: "Archived Requests",
          headerShown: true,
          headerBackVisible: false, // hide the default back
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
