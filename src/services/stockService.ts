import axios from '../api/axiosInstance';

export const getAllStock = () => axios.get('/stock');
export const updateStock = (id: string, quantity: number) =>
  axios.put(`/stock/${id}`, { quantity });

export const uploadStockFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post('/stock/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
