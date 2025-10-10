import axios from "axios";

export async function fetchAdherence(userId) {
  const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/adherence/${userId}`);
  return res.data;
}
