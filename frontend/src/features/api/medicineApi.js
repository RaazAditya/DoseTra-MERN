import axios from "axios";

const MEDICINE_API = "http://localhost:7000/api/v1/medicine";

export const getMedicines = async () => {
  const res = await axios.get(MEDICINE_API);
  return res.data;
};

export const getMedicineById = async (id) => {
  const res = await axios.get(`${MEDICINE_API}/${id}`);
  return res.data;
};

export const createMedicine = async (data) => {
  const res = await axios.post(MEDICINE_API, data);
  return res.data;
};

export const updateMedicine = async (id, data) => {
  const res = await axios.put(`${MEDICINE_API}/${id}`, data);
  return res.data;
};

export const deleteMedicine = async (id) => {
  const res = await axios.delete(`${MEDICINE_API}/${id}`);
  return res.data;
};
