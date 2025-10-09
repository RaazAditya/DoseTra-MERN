import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import medicineReducer from "../features/medicineSlice"; // ← import your new slice
import notificationReducer from "@/features/notificationSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  medicine: medicineReducer, // ← add it here
  notifications: notificationReducer,
});

export const appStore = configureStore({
  reducer: rootReducer,
});
