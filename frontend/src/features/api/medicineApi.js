import axios from "axios";

const API_URL = "http://localhost:7000/api/v1/medicine";

const getToken = () => localStorage.getItem("token");

export const addMedicineAPI = async (medicineData) => {
  const res = await axios.post(API_URL, medicineData, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.data;
};

export const fetchMedicinesAPI = async () => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.data.data;
};

export const deleteMedicineAPI = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.data;
};
