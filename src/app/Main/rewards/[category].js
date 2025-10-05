import { useLocalSearchParams, Stack } from "expo-router";
import RewardItem from "./reward_item";

export default function RewardsCategoryPage() {
  const { category } = useLocalSearchParams(); // "gcash", "load", "sack", or "others"

  const getHeaderTitle = (category) => {
    switch (category) {
      case "gcash":
        return "List of GCash Offers";
      case "load":
        return "List of Load Offers";
      case "sack":
        return "List of Rice Rewards";
      case "others":
        return "List of Other Rewards";
      default:
        return "Rewards";
    }
  };

  return (
    <>
      {/* ✅ Dynamic header title based on category */}
      <Stack.Screen
        options={{
          title: getHeaderTitle(category),
        }}
      />

      {/* ✅ Render items for the selected category */}
      <RewardItem category={category} />
    </>
  );
}
