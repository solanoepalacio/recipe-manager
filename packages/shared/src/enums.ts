/**
 * User gender field.
 * From plans/01_App/01_tech_stack_and_data_model.md: User.gender
 */
export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

/**
 * User type — determines which credentials are required and how the user interacts.
 * normal: full login user (email + password required)
 * kid: no-login member (name + dateOfBirth only)
 * agent: API-consuming bot (name only, gets an auto-assigned API token)
 */
export enum UserType {
  Normal = 'normal',
  Kid = 'kid',
  Agent = 'agent',
}

/**
 * Meal plan entry meal type.
 * From plans/01_App/01_tech_stack_and_data_model.md: MealPlanEntry.mealType
 * Values: breakfast | lunch | dinner | snack | dessert
 */
export enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack',
  Dessert = 'dessert',
}
