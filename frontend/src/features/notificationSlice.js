// src/features/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:7000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // [{...}, {...}]
  }
);

// Mark all as seen
export const markNotificationsSeen = createAsyncThunk(
  "notifications/markSeen",
  async () => {
    const token = localStorage.getItem("token");
    await axios.patch(
      "http://localhost:7000/api/notifications/mark-seen",
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return true;
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unseenCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unseenCount += 1;
    },
    markAllSeenLocally: (state) => {
      state.items = state.items.map((n) => ({ ...n, seen: true }));
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        // Initial unseenCount calculation
        state.unseenCount = action.payload.filter(
          (n) => n.status === "sent" && !n.seen
        ).length;
      })
      .addCase(markNotificationsSeen.fulfilled, (state) => {
        state.unseenCount = 0;
        // state.items = state.items.map((n) => ({ ...n, seen: true }));
      });
  },
});

export const { addNotification,markAllSeenLocally } = notificationSlice.actions;
export default notificationSlice.reducer;
