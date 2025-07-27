import { Stack } from "expo-router";

export default function requestPickupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
