import axios from "axios";

export async function fetchAdherence(userId) {
  const res = await axios.get(`/api/adherence/${userId}`);
  return res.data;
}
