export type TripStatus = "planned" | "completed";

export type Trip = {
  id: number;
  title: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  notes: string;
  created_at: string;
};

export type Campsite = {
  id: number;
  trip_id: number | null;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  visited_on: string | null;
  rating: number | null;
  site_number: string;
  would_return: number;
  notes: string;
  created_at: string;
};

export type Hike = {
  id: number;
  trip_id: number | null;
  name: string;
  hiked_on: string | null;
  distance_miles: number | null;
  elevation_ft: number | null;
  difficulty: number | null;
  views: number | null;
  would_repeat: number;
  notes: string;
  created_at: string;
};

export type GearCondition = "new" | "good" | "worn" | "repair" | "retired";

export type Gear = {
  id: number;
  name: string;
  category: string;
  condition: GearCondition;
  quantity: number;
  weight_oz: number | null;
  retired: number;
  notes: string;
  created_at: string;
};

export type PackListEntry = Gear & { packed: number | null; on_list: number };

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type Meal = {
  id: number;
  trip_id: number;
  day: string | null;
  slot: MealSlot;
  name: string;
  notes: string;
  created_at: string;
};

export type MealItem = {
  id: number;
  meal_id: number;
  item: string;
  quantity: string;
  packed: number;
};

export const GEAR_CATEGORIES = [
  "Shelter",
  "Sleep",
  "Kitchen",
  "Water",
  "Clothing",
  "Navigation",
  "Light",
  "Safety",
  "Camp Comfort",
  "Other",
] as const;

export const GEAR_CONDITIONS: { value: GearCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "worn", label: "Worn in" },
  { value: "repair", label: "Needs repair" },
  { value: "retired", label: "Retired" },
];

export const MEAL_SLOTS: { value: MealSlot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snacks" },
];
