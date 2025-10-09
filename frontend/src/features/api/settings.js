import axios from "axios";

export async function toggleSmartReminder(userId, enabled) {
  const res = await axios.post(`/api/settings/${userId}/smart-reminder`, { enabled });
  return res.data;
}
