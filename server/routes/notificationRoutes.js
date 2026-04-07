import express from "express";
import Notification from "../models/Notification.js";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

// CREATE notification + send email
router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body;

    const notification = await Notification.create({
      email,
      message,
    });

    await sendEmail(email || process.env.NOTIFY_RECIPIENT, message);


    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET notifications for user
router.get("/:email", async (req, res) => {
  try {
    const notifications = await Notification.find({
      email: req.params.email,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
