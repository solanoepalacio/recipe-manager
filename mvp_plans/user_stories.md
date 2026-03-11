# Recipe Manager MVP — Feature List

Every feature is described as a user story. Features are grouped by category.

---

## Table of Contents

1. [Recipe Creation](#1-recipe-creation)
2. [Recipe Editing & Content](#2-recipe-editing--content)
3. [Recipe Viewing & Cooking](#3-recipe-viewing--cooking)
4. [Recipe Search & Discovery](#4-recipe-search--discovery)
5. [Meal Planning](#5-meal-planning)
6. [Ingredient & Food Management](#6-ingredient--food-management)
7. [Recipe Sharing](#7-recipe-sharing)
8. [User Accounts & Profiles](#8-user-accounts--profiles)
9. [Authentication & Sign-In](#9-authentication--sign-in)
10. [Households](#10-households)
11. [Administration](#11-administration)
12. [API & Developer Access](#13-api--developer-access)
13. [Mobile & Accessibility](#14-mobile--accessibility)

---

## 1. Recipe Creation

- As a user, I can create a new recipe from scratch by filling out a form with all recipe details.
- As a user, I can duplicate an existing recipe to create an independent copy with a new name.

---

## 2. Recipe Editing & Content

### Basic Information

- As a user, I can set a recipe's name, and a URL-friendly slug is automatically generated.
- As a user, I can write a description for my recipe using rich text formatting.
- As a user, I can specify the number of servings or yield (both a quantity and a unit, e.g., "12 cookies").
- As a user, I can record prep time, cook time, total time, and perform time for a recipe.
- As a user, I can store the original source URL of the recipe for reference.

### Ingredients

- As a user, I can add ingredients with a quantity, unit, and food name.
- As a user, I can add notes or comments to individual ingredients.
- As a user, I can organize ingredients into titled sections (e.g., "For the dough", "For the filling").

### Instructions

- As a user, I can add step-by-step instructions to my recipe.
- As a user, I can give each step a title for section organization.
- As a user, I can reorder steps by dragging and dropping them.

### Images

- As a user, I can upload an image for my recipe.
- As a user, I can delete a recipe image.

### Settings

- As a user, I can lock a recipe to prevent anyone from editing it.
- As a user, I can choose to display a recipe in landscape view.

---

## 3. Recipe Viewing & Cooking

- As a user, I can view a recipe's full details on a dedicated page including ingredients, instructions, and images.
- As a user, I can enter a full-screen "cook mode" designed for use in the kitchen, with large readable text and step-by-step navigation.

---

## 4. Recipe Search & Discovery

- As a user, I can search for recipes by name using a text search.
- As a user, I can use fuzzy search to find recipes even if I have typos.
- As a user, I can filter recipes by specific foods or ingredients.
- As a user, I can sort recipes by name, date created, date updated, or randomly.
- As a user, I can control the sort direction (ascending or descending).
- As a user, I can browse recipes with pagination and choose how many recipes appear per page.
- As a user, I can use a dedicated recipe finder page.

---

## 5. Meal Planning

- As a user, I can plan my meals for the week on a calendar-style planner.
- As a user, I can assign recipes to specific dates and meal types (breakfast, lunch, dinner, snack, dessert).
- As a user, I can drag and drop recipes to reorganize my meal plan.
- As a user, I can choose how many days to display in my planner (one or four weeks).
- As a user, I can edit or delete individual meal plan entries.

---

## 6. Ingredient & Food Management

### Foods Database

The foods database is pre-populated via migrations or fixtures. Users select from existing foods when adding ingredients to recipes. Only administrators manage the food data.

### Units Database

The units database is pre-populated via migrations or fixtures. Users select from existing units when adding ingredients to recipes. Only administrators manage the unit data.

---

## 7. Recipe Sharing

- As a user, I can generate a shareable link for any recipe so others can view it without logging in.

---

## 8. User Accounts & Profiles

- As a user, I can view and edit my profile information (name, email, username).

---

## 9. Authentication & Sign-In

- As a user, I can sign in with my email/username and password.
- As a user, I have persistent sessions by default.

---

## 10. Households

- As a user, I belong to a household, sharing meal plans with household members.
- All recipes within a household are private to its members.

---

## 11. Administration

### User Management

- As an administrator, I can view a paginated list of all users in the system.
- As an administrator, I can create new user accounts.
- As an administrator, I can edit any user's profile.
- As an administrator, I can delete user accounts.
- As an administrator, I can generate a password reset URL to share with a user.

### Household Management

- As an administrator, I can view, create, edit, and delete households.

### Initial Setup

- As an administrator, I can complete a first-time setup wizard when the application is freshly installed.

---

## 12. API & Developer Access

- As an administrator, I can create long-lived API tokens for programmatic users.
- As an administrator, I can manage (view and delete) API tokens.
- As a developer, I can access the full application functionality through a REST API.
- As a developer, I can browse interactive API documentation (Swagger UI).

---

## 13. Mobile & Accessibility

- As a user, I can use the application on my phone, tablet, or desktop with a responsive layout that adapts to my screen size.
- As a user, I can see helpful loading indicators while content is being fetched.
- As a user, I can see success, error, and informational notifications.
