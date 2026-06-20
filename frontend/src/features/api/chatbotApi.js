import axios from "axios";

const CHATBOT_API = `${import.meta.env.VITE_BACKEND_URL}/api/chatbot`;

export const sendChatMessage = async (message, token) => {
  const res = await axios.post(
    CHATBOT_API,
    { message },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
