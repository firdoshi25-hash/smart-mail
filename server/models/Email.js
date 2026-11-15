import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  recipientEmail: { type: String, default: null, lowercase: true, trim: true, maxlength: 254 },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 10000 },
  isRead: { type: Boolean, default: false },
  deliveryStatus: { type: String, enum: ["pending", "sent", "failed"], default: "sent" },
  messageId: { type: String, default: null },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

emailSchema.index({ recipient: 1, createdAt: -1 });
emailSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model("Email", emailSchema);
