import mongoose from "mongoose";

// Utility function to get the current date and time in IST
function getISTTime() {
  const date = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(date.getTime() + istOffset);
}

const RefreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  blackList: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: getISTTime, // Use the custom function to set IST time
    expires: "5d",
  },
});

export default mongoose.model.refreshTokens ||
  mongoose.model("RefreshTokens", RefreshTokenSchema);
