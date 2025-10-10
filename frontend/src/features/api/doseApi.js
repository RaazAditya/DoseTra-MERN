import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/doses`, // adjust if hosted elsewhere
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

//  Bulk update multiple doses
export const updateMultipleDoses = async (doses) => {
  const res = await API.put(
    "/update-multiple",
    { doses }, // body
    getAuthConfig()
  );
  return res.data;
};

