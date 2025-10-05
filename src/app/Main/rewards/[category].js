import { useLocalSearchParams, Stack } from "expo-router";
import RewardItem from "./reward_item";

export default function RewardsCategoryPage() {
  const { category } = useLocalSearchParams(); // "gcash", "rice", or "load"

  return (
    <>
      {/* 👇 This dynamically sets the header title */}
      <Stack.Screen
        options={{
          title:
            category === "gcash"
              ? "List of GCash Offers"
              : category === "load"
              ? "List of Load Offers"
              : category === "rice"
              ? "List of Rice Rewards"
              : "Rewards",
        }}
      />

      {/* Your actual screen content */}
      <RewardItem category={category} />
    </>
  );
}
