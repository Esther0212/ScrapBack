import { Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function RewardsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#F0F1C5" },
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
      }}
    >
      {/* ✅ Dynamic header titles will come from the child screen */}
   <Stack.Screen
  name="[category]"
  options={{
    headerShown: true,
    headerBackVisible: false,
    headerTitle: "", // ⬅️ let child screen control the title
    headerLeft: () => (
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="chevron-back-outline" size={24} color="black" />
      </TouchableOpacity>
    ),
  }}
/>

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
        name="reward_description"
        options={{
          title: "Reward Details",
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
        name="reward_item"
        options={{
          title: "Reward Items",
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
