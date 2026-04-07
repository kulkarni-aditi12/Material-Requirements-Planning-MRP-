import Notification from "../models/Notification.js";
import sendEmail from "./sendEmail.js";

const notify = async (message) => {
  // 1. Save in DB
  await Notification.create({ message });

  // 2. Send email
  await sendEmail(process.env.NOTIFY_RECIPIENT, message);
};

export default notify;
