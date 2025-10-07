import axios from "axios";

const USER_API = "http://localhost:7000/api/v1/auth";

export const registerUser = async (formData) => {
  const res = await axios.post(`${USER_API}/register`, formData);
  return res.data;
};

export const loginUser = async (formData) => {
  const res = await axios.post(`${USER_API}/login`, formData);
  return res.data;
};

export const getProfile = async (token) => {
  const res = await axios.get(`${USER_API}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
};

// Update user profile
export const updateUserProfile = async (updatedData, token) => {
  try {
    const response = await axios.put(`${USER_API}/update`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.user; // updated user object
  } catch (error) {
    throw error.response?.data || { message: "Update failed" };
  }
};

export const getDashboardSummary = async (token) => {
  try {
    const res = await axios.get(`${USER_API}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { adherence, upcoming, missedTrends }
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch dashboard" };
  }
};
