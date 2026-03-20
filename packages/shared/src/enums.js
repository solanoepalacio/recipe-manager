"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealType = exports.UserType = exports.Gender = void 0;
var Gender;
(function (Gender) {
    Gender["Male"] = "male";
    Gender["Female"] = "female";
    Gender["Other"] = "other";
})(Gender || (exports.Gender = Gender = {}));
var UserType;
(function (UserType) {
    UserType["Normal"] = "normal";
    UserType["Kid"] = "kid";
    UserType["Agent"] = "agent";
})(UserType || (exports.UserType = UserType = {}));
var MealType;
(function (MealType) {
    MealType["Breakfast"] = "breakfast";
    MealType["Lunch"] = "lunch";
    MealType["Dinner"] = "dinner";
    MealType["Snack"] = "snack";
    MealType["Dessert"] = "dessert";
})(MealType || (exports.MealType = MealType = {}));
