import mongoose from "mongoose";

const RecoveryOTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expireAfterSeconds: 600  // expire in 10 minutes
  },
});


export default mongoose.model.recoveryOTP ||
  mongoose.model("RecoveryOTP", RecoveryOTPSchema);
