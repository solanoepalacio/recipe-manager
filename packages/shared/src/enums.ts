/**
 * User gender field.
 * From mvp_plans/01_tech_stack_and_data_model.md: User.gender
 */
export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

/**
 * Meal plan entry meal type.
 * From mvp_plans/01_tech_stack_and_data_model.md: MealPlanEntry.mealType
 * Values: breakfast | lunch | dinner | snack | dessert
 */
export enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack',
  Dessert = 'dessert',
}
