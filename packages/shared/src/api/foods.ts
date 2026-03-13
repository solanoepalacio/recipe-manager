export interface FoodResponse {
  id: string;
  name: string;
}

export interface FoodListResponse {
  items: FoodResponse[];
  total: number;
}
