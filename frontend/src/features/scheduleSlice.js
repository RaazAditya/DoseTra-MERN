import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchSchedules = createAsyncThunk("schedules/fetchSchedules", async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedules`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
});

const scheduleSlice = createSlice({
  name: "schedules",
  initialState: {
    schedules: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default scheduleSlice.reducer;
