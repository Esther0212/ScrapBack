import { useLocalSearchParams, Stack } from "expo-router";
import RewardItem from "./reward_item";

export default function RewardsCategoryPage() {
  const { category } = useLocalSearchParams(); // "sack", "load", "cash", or "other"

  const getHeaderTitle = (cat) => {
    switch (cat?.toLowerCase()) {
      case "cash":
        return "List of Cash Rewards";
      case "load":
        return "List of Load Offers";
      case "sack":
        return "List of Rice Rewards";
      case "other":
        return "List of Other Rewards";
      default:
        return "Rewards";
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: getHeaderTitle(category),
        }}
      />
      <RewardItem category={category} />
    </>
  );
}
