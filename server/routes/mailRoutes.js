import { Router } from "express";
import {
  deleteEmail,
  getEmailById,
  getInbox,
  getSentEmails,
  getUnreadCount,
  markEmailRead,
  sendEmail,
} from "../controllers/emailController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);
router.post("/send", sendEmail);
router.get("/inbox", getInbox);
router.get("/sent", getSentEmails);
router.get("/unread-count", getUnreadCount);
router.get("/:id", getEmailById);
router.put("/:id/read", markEmailRead);
router.delete("/:id", deleteEmail);

export default router;
