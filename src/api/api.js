import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const fetchMaterials = async () => {
  const res = await axios.get(`${BASE_URL}/materials`);
  return res.data;
};

export const fetchPOs = async () => {
  const res = await axios.get(`${BASE_URL}/pos`);
  return res.data;
};
