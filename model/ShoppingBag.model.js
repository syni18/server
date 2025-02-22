import mongoose from "mongoose";

// Define the schema for cart items
const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products", // Reference to the Product model
    required: true,
  },
  name: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1, // Ensure quantity is at least 1
  },
  discount: {
    type: {
      type: String, // Type of discount: 'percentage', 'value', or 'coupon'
      enum: ["percentage", "value", "coupon"],
    },
    value: {
      type: Number,
      min: 0, // Ensure discount value is at least 0
    },
    couponCode: {
      type: String,
      default: null,
    },
  },
});

// Define the schema for the shopping bag
const ShoppingBagSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    items: {
      type: [CartItemSchema], // Array of cart items
      default: [],
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0, // Default value
    },
    couponApplied: {
      type: String,
      default: null,
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Addresses", // Reference to the Addresses model
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    toJSON: { virtuals: true }, // Enable virtuals for JSON output
    toObject: { virtuals: true }, // Enable virtuals for object output
  }
);

// Define virtuals for frequently populated fields
ShoppingBagSchema.virtual("user", {
  ref: "User", // Reference model
  localField: "userId", // Field in this schema
  foreignField: "_id", // Field in the referenced model
  justOne: true, // Return a single user
});

ShoppingBagSchema.virtual("deliveryDetails", {
  ref: "Addresses",
  localField: "deliveryAddress",
  foreignField: "_id",
  justOne: true,
});

// Add populate for `productId` in the items array
CartItemSchema.virtual("product", {
  ref: "Products", // Reference model
  localField: "productId", // Field in this schema
  foreignField: "_id", // Field in the referenced model
  justOne: true,
});

// Prevent duplicate compilation and export
export default
  mongoose.models.ShoppingBag ||
  mongoose.model("ShoppingBag", ShoppingBagSchema);
