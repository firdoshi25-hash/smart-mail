import mongoose from "mongoose";
import Email from "../models/Email.js";
import User from "../models/User.js";
import { getSmtpConfig, sendExternalEmail } from "../config/mail.js";

const populatedEmail = (query) => query
  .populate("sender", "name email")
  .populate("recipient", "name email");

function isValidEmailAddress(email) {
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const [localPart, domain] = email.split("@");
  return localPart.length <= 64
    && !localPart.startsWith(".")
    && !localPart.endsWith(".")
    && !localPart.includes("..")
    && domain.split(".").every((label) => label.length > 0 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-"));
}

function getDeliveryError(error) {
  if (error.code === "SMTP_NOT_CONFIGURED") {
    return {
      code: error.code,
      message: "Gmail sending isn't configured on the server. Check the SMTP settings in server/.env and restart the backend.",
    };
  }
  if (error.code === "SMTP_SENDER_MISMATCH") {
    return {
      code: error.code,
      message: "The signed-in email doesn't match the Gmail account configured for sending. Sign in with the configured account.",
    };
  }
  return {
    code: "SMTP_DELIVERY_FAILED",
    message: "Gmail couldn't send this message. Check the SMTP settings and Google App Password, then try again.",
  };
}

export async function sendEmail(req, res, next) {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const recipientEmail = typeof body.recipientEmail === "string" ? body.recipientEmail.trim().toLowerCase() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!recipientEmail || !subject || !message) {
      return res.status(400).json({ message: "Recipient, subject, and message are required." });
    }
    if (!isValidEmailAddress(recipientEmail)) {
      return res.status(400).json({ message: "Enter a valid recipient email address.", code: "INVALID_RECIPIENT_EMAIL" });
    }
    if (subject.length > 160 || message.length > 10000) {
      return res.status(400).json({ message: "Subject must be under 160 characters and message under 10,000 characters." });
    }

    const smtpConfig = getSmtpConfig();
    const sender = await User.findById(req.userId).select("name email");
    if (!sender) return res.status(401).json({ message: "Your account is no longer available. Please sign in again." });

    const recipient = await User.findOne({ email: recipientEmail })
      .collation({ locale: "en", strength: 2 })
      .select("_id");

    const email = await Email.create({
      sender: sender._id,
      recipient: recipient?._id || null,
      recipientEmail,
      subject,
      message,
      deliveryStatus: "pending",
    });

    let deliveryError = null;
    try {
      if (!smtpConfig) {
        const error = new Error("SMTP settings aren't configured.");
        error.code = "SMTP_NOT_CONFIGURED";
        throw error;
      }
      if (sender.email.toLowerCase() !== smtpConfig.user) {
        const error = new Error("The authenticated SMTP account does not match the signed-in user.");
        error.code = "SMTP_SENDER_MISMATCH";
        throw error;
      }
      const delivery = await sendExternalEmail({
        fromName: sender.name,
        fromEmail: sender.email,
        to: recipientEmail,
        subject,
        text: message,
      });
      email.deliveryStatus = "sent";
      email.messageId = delivery.messageId || null;
    } catch (error) {
      deliveryError = getDeliveryError(error);
      email.deliveryStatus = "failed";
      console.error("External email delivery failed:", error.code || "SMTP_ERROR");
    }

    await email.save();

    if (recipient) {
      const unreadCount = await Email.countDocuments({
        recipient: recipient._id,
        isRead: false,
        deletedBy: { $ne: recipient._id },
      });
      const io = req.app.get("io");
      if (io) {
        const emailForNotification = await populatedEmail(Email.findById(email._id).lean());
        io.to(`user:${recipient._id.toString()}`).emit("newEmail", {
          email: emailForNotification,
          unreadCount,
        });
      }
    }

    if (deliveryError && !recipient) {
      return res.status(502).json({
        message: deliveryError.message,
        code: deliveryError.code,
      });
    }
    if (deliveryError) {
      return res.status(201).json({
        message: `Saved in ${recipientEmail}'s Smart Mail inbox, but the external email could not be sent. ${deliveryError.message}`,
        code: deliveryError.code,
        externalDelivery: "failed",
        email: email.toObject(),
      });
    }
    return res.status(201).json({
      message: `Email sent to ${recipientEmail}. The email provider accepted it; final inbox delivery depends on the recipient's provider.`,
      externalDelivery: "sent",
      email: email.toObject(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getInbox(req, res, next) {
  try {
    const [emails, unreadCount] = await Promise.all([
      Email.find({ recipient: req.userId, deletedBy: { $ne: req.userId } }).populate("sender", "name email").sort({ createdAt: -1 }).lean(),
      Email.countDocuments({ recipient: req.userId, isRead: false, deletedBy: { $ne: req.userId } }),
    ]);
    return res.status(200).json({ count: emails.length, unreadCount, emails });
  } catch (error) {
    return next(error);
  }
}

export async function getSentEmails(req, res, next) {
  try {
    const emails = await Email.find({ sender: req.userId, deletedBy: { $ne: req.userId } })
      .populate("recipient", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ count: emails.length, emails });
  } catch (error) {
    return next(error);
  }
}

export async function getEmailById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Email not found." });
    const email = await Email.findOne({
      _id: id,
      deletedBy: { $ne: req.userId },
      $or: [{ sender: req.userId }, { recipient: req.userId }],
    });
    if (!email) return res.status(404).json({ message: "Email not found." });
    if (email.recipient?.toString() === req.userId && !email.isRead) {
      email.isRead = true;
      await email.save();
    }
    const [result, unreadCount] = await Promise.all([
      populatedEmail(Email.findOne({ _id: email._id, deletedBy: { $ne: req.userId } }).lean()),
      Email.countDocuments({ recipient: req.userId, isRead: false, deletedBy: { $ne: req.userId } }),
    ]);
    if (!result) return res.status(404).json({ message: "Email not found." });
    return res.status(200).json({
      email: { ...result, isSender: result.sender._id.toString() === req.userId },
      unreadCount,
    });
  } catch (error) {
    return next(error);
  }
}

export async function markEmailRead(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Email not found." });
    const email = await Email.findOneAndUpdate(
      { _id: id, recipient: req.userId, deletedBy: { $ne: req.userId } },
      { isRead: true },
      { new: true },
    ).populate("sender", "name email");
    if (!email) return res.status(404).json({ message: "Email not found in your inbox." });
    const unreadCount = await Email.countDocuments({
      recipient: req.userId,
      isRead: false,
      deletedBy: { $ne: req.userId },
    });
    return res.status(200).json({ message: "Email marked as read.", email, unreadCount });
  } catch (error) {
    return next(error);
  }
}

export async function deleteEmail(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Email not found." });
    const email = await Email.findOneAndUpdate(
      { _id: id, deletedBy: { $ne: req.userId }, $or: [{ sender: req.userId }, { recipient: req.userId }] },
      { $addToSet: { deletedBy: req.userId } },
      { new: true },
    );
    if (!email) return res.status(404).json({ message: "Email not found." });
    const unreadCount = await Email.countDocuments({
      recipient: req.userId,
      isRead: false,
      deletedBy: { $ne: req.userId },
    });
    return res.status(200).json({ message: "Email removed from your mailbox.", unreadCount });
  } catch (error) {
    return next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const unreadCount = await Email.countDocuments({
      recipient: req.userId,
      isRead: false,
      deletedBy: { $ne: req.userId },
    });
    return res.status(200).json({ unreadCount });
  } catch (error) {
    return next(error);
  }
}
