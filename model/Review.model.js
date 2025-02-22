import mongoose from "mongoose";

const reviewCardSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  title: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  images: [String],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reviewCard: [reviewCardSchema],
});

// Add populate for `productId` in the items array
reviewSchema.virtual("product", {
  ref: "Products", // Reference model
  localField: "productId", // Field in this schema
  foreignField: "_id", // Field in the referenced model
  justOne: true,
});

reviewSchema.virtual("order", {
  ref: "Orders", // Reference model
  localField: "orderId", // Field in this schema
  foreignField: "_id", // Field in the referenced model
  justOne: true,
});
export default mongoose.model.reviews ||
  mongoose.model("Reviews", reviewSchema);