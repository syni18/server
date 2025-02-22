// Import mongoose
import mongoose from "mongoose";

// Define the Address schema (assuming it's used elsewhere)
const AddressSchema = new mongoose.Schema({

  fullName: String,
  phoneNumber: [],
  pincode: String,
  locality: String,
  address: String,
  cityDistrictTown: String,
  state: String,
  landmark: String,
  addressType: String,
});

// Define subdocument schema for social profiles
const SocialProfileSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Facebook", "Twitter", "LinkedIn", "Instagram", "Other"],
  },
  url: String,
});

// Define subdocument schema for PAN card information
const PANSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  panNumber: {
    type: String,
    required: true,
  },
  panImage: String, // Assuming you will store the image path
  declaration: {
    type: Boolean,
    default: false,
  },
});

// Define subdocument schema for Aadhar card information
const AADHARschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  aadharImage: [String], // Assuming you will store the image path
  declaration: {
    type: Boolean,
    default: false,
  },
});

// Define subdocument schema for the watchlist item
const WishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to your Product model
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Define the User schema
const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    index: true,
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email address"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  decryptPassword: {
    type: String,
    select: false,
  },
  dateOfBirth: Date,
  phoneNo: {
    type: String
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  avatar: String,
  bio: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  lastLoginAt: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verifiedAt: Date,
  },
  address: [AddressSchema],
  socialProfiles: [SocialProfileSchema],
  preferences: {
    theme: String,
    language: String,
  },
  languages: {
    type: [String],
    default: ["English"], // Assuming default language is English
  },
  security: {
    twoFactorAuth: {
      type: Boolean,
      default: false,
    },
    securityQuestions: [
      {
        question: String,
        answer: String,
      },
    ],
  },
  panCard: PANSchema, // Include the PAN card schema as a subdocument
  aadharCard: AADHARschema, // Include the Aadhar card schema as a subdocument
  wishlist: [WishlistItemSchema], // Include the watchlist schema as a subdocument
});

// Export the User model
export default mongoose.model.users || mongoose.model("User", UserSchema);
