import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authAPI from "./api/authApi"

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunk for registration
export const register = createAsyncThunk(
  "auth/register",
  async (formData, thunkAPI) => {
    try {
      const data = await authAPI.registerUser(formData);
      return data; // { user, token }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (formData, thunkAPI) => {
    try {
      const data = await authAPI.loginUser(formData);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, thunkAPI) => {
    const token = localStorage.getItem("token");
    if (!token) return thunkAPI.rejectWithValue("No token found");
    try {
      const data = await authAPI.getProfile(token);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (updatedData, thunkAPI) => {
    const token = localStorage.getItem("token");
    if (!token) return thunkAPI.rejectWithValue("No token found");
    try {
      const data = await authAPI.updateUserProfile(updatedData, token);
      return data; // updated user object
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      // register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    })
    .addCase(updateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;