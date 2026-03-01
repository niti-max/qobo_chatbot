import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const sendChatMessage = async (message) => {
  const response = await axios.post(`${API_BASE_URL}/chat`, { message }, { timeout: 15000 });
  return response.data;
};
