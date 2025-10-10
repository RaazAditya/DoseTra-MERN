import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:7000/api/doses", // adjust if hosted elsewhere
  withCredentials: true, // only if you’re using JWT/cookies
});

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};


// ✅ Fetch doses from DB
export const getDoses = async () => {
  const res = await API.get("/", getAuthConfig());
  return res.data;
};


// Mark as taken
export const markDoseTaken = async (id) => {
  const res = await API.put(`/${id}/mark-taken`,null,getAuthConfig());
  return res.data;
};

// Mark as missed
export const markDoseMissed = async (id) => {
  const res = await API.put(`/${id}/mark-missed`,null,getAuthConfig());
  return res.data;
};