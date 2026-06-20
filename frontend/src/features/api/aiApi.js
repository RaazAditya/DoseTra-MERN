import axios from "axios";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchAiPredict() {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/ai/predict`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function fetchAdherenceInsight() {
  const res = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/api/ai/adherence-insight`,
    { headers: authHeaders() }
  );
  return res.data;
}
