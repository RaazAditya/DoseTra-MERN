import axios from "axios";

const USER_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth`;
const CALENDAR_API = `${import.meta.env.VITE_BACKEND_URL}/api/calendar`;

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const registerUser = async (formData) => {
  const res = await axios.post(`${USER_API}/register`, formData);
  return res.data;
};

export const verifyOtpUser = async ({ email, otp }) => {
  const res = await axios.post(`${USER_API}/verify-otp`, { email, otp });
  return res.data;
};

export const resendOtpUser = async (email) => {
  const res = await axios.post(`${USER_API}/resend-otp`, { email });
  return res.data;
};

export const loginUser = async (formData) => {
  const res = await axios.post(`${USER_API}/login`, formData);
  return res.data;
};

export const googleLoginUser = async (credential) => {
  const res = await axios.post(`${USER_API}/google`, { credential });
  return res.data;
};

export const getProfile = async (token) => {
  const res = await axios.get(`${USER_API}/profile`, authHeaders(token));
  return res.data.user;
};

export const updateUserProfile = async (updatedData, token) => {
  const response = await axios.put(`${USER_API}/update`, updatedData, authHeaders(token));
  return response.data.user;
};

export const deleteUserProfile = async (token) => {
  const res = await axios.delete(`${USER_API}/profile`, authHeaders(token));
  return res.data;
};

export const getDashboardSummary = async (token) => {
  const res = await axios.get(`${USER_API}/dashboard`, authHeaders(token));
  return res.data;
};

export const getCalendarConnectUrl = async (token) => {
  const res = await axios.get(`${CALENDAR_API}/connect`, authHeaders(token));
  return res.data.authUrl;
};

export const getCalendarStatus = async (token) => {
  const res = await axios.get(`${CALENDAR_API}/status`, authHeaders(token));
  return res.data;
};

export const disconnectCalendar = async (token) => {
  const res = await axios.post(`${CALENDAR_API}/disconnect`, {}, authHeaders(token));
  return res.data;
};

export const setCalendarAutoSync = async (token, autoSync) => {
  const res = await axios.patch(`${CALENDAR_API}/auto-sync`, { autoSync }, authHeaders(token));
  return res.data;
};

export const syncCalendarNow = async (token) => {
  const res = await axios.post(`${CALENDAR_API}/sync`, {}, authHeaders(token));
  return res.data;
};
