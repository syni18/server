import mongoose from "mongoose";

const PancardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true, // Make it immutable
    },
    fullname: {
      type: String,
      required: true,
      trim: true, // Remove unnecessary whitespace
    },
    panNumber: {
      number: {
        type: String,
        required: true,
        unique: true,
        immutable: true, // Ensures it cannot be updated
      },
      secret: {
        iv: {
          type: Buffer,
          required: true,
          immutable: true, // Ensures it cannot be updated
        },
        key: {
          type: Buffer,
          required: true,
          immutable: true, // Ensures it cannot be updated
        },
      },
    },
    panImage: {
      image: {
        type: String,
        required: true,
        immutable: true, // Make it immutable
      },
      secret: {
        iv: {
          type: Buffer,
          required: true,
          immutable: true, // Ensures it cannot be updated
        },
        key: {
          type: Buffer,
          required: true,
          immutable: true, // Ensures it cannot be updated
        },
      },
    },
    declaration: {
      type: Boolean,
      required: true,
      default: false,
      immutable: true, // Make it immutable
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// Add an index to improve search queries by userId
PancardSchema.index({ userId: 1 });

// Optional pre-save hook to update `updatedAt`
PancardSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

export default mongoose.model.pancard ||
  mongoose.model("Pancard", PancardSchema);

