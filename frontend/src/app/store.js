import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import medicineReducer from "../features/medicineSlice"; // ← import your new slice
import notificationReducer from "@/features/notificationSlice";
import doseReducer from "@/features/doseSlice";
import scheduleReducer from "@/features/scheduleSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  medicine: medicineReducer, // ← add it here
  notifications: notificationReducer,
  schedules: scheduleReducer,
  doses: doseReducer,
});

export const appStore = configureStore({
  reducer: rootReducer,
});
