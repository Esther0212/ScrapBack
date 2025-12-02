import { Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function profileLayout() {
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
          title: "Profile",
          headerShown: true,
          headerBackVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/Main/profile/settings")}
            >
              <Ionicons name="menu" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings and Privacy",
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
        name="accountInfo"
        options={{
          title: "Account Information",
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
        name="contributionLogs"
        options={{
          title: "Waste Contribution Receipt",
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
        name="redemptionLogs"
        options={{
          title: "Reward Redemption Receipt",
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
        name="changePassword"
        options={{
          title: "Change Password",
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
        name="about"
        options={{
          title: "About PACAFACO",
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