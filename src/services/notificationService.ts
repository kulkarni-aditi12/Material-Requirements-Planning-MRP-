import axios from "axios";

const API = "http://localhost:5000/api/notifications";

export const getNotifications = (email: string) =>
  axios.get(`${API}/${email}`);

export const sendNotification = (email: string, message: string) =>
  axios.post(API, { email, message });
