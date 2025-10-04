import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";

const rootReducer = combineReducers({
  auth: authReducer,
});

export const appStore = configureStore({
  reducer: rootReducer,
});

