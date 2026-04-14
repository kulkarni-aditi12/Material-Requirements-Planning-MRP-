import axiosInstance from "../api/axiosInstance";

export const getPurchaseOrders = async () => {
  const res = await axiosInstance.get("/purchase");
  return res.data;
};

export const createPurchaseOrder = async (data: any) => {
  const res = await axiosInstance.post("/purchase", data);
  return res.data;
};

export const updatePurchaseOrder = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/purchase/${id}`, data);
  return res.data;
};
