import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createMedicine, getMedicines, deleteMedicine } from "./api/medicineApi";

const initialState = {
  medicines: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchMedicines = createAsyncThunk("medicine/fetchAll", async () => {
  return await getMedicines();
});

export const addMedicine = createAsyncThunk("medicine/add", async (medicineData, thunkAPI) => {
  try {
    return await createMedicine(medicineData);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteMedicineById = createAsyncThunk("medicine/delete", async (id) => {
  await deleteMedicine(id);
  return id;
});

const medicineSlice = createSlice({
  name: "medicine",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicines.pending, (state) => { state.loading = true; })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.loading = false;
        state.medicines = action.payload;
      })
      .addCase(addMedicine.fulfilled, (state, action) => {
        state.medicines.push(action.payload);
      })
      .addCase(deleteMedicineById.fulfilled, (state, action) => {
        state.medicines = state.medicines.filter(med => med._id !== action.payload);
      });
  },
});

export default medicineSlice.reducer;
