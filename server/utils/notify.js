import Notification from "../models/Notification.js";

const notify = async (message) => {
  await Notification.create({ message });
  await sendEmail(process.env.NOTIFY_RECIPIENT, message);
};

export default notify;
