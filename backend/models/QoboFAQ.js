import mongoose from "mongoose";

const QoboFAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  url: { type: String, required: true },
  keywords: [String],
  createdAt: { type: Date, default: Date.now }
});

QoboFAQSchema.index({ question: "text", answer: "text" });

const QoboFAQ = mongoose.model("QoboFAQ", QoboFAQSchema);

export default QoboFAQ;
