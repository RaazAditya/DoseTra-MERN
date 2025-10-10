import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchDoses = createAsyncThunk("doses/fetchDoses", async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get("http://localhost:7000/api/doses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
});

const doseSlice = createSlice({
  name: "doses",
  initialState: {
    doses: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDoses.fulfilled, (state, action) => {
        state.loading = false;
        state.doses = action.payload;
      })
      .addCase(fetchDoses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default doseSlice.reducer;
