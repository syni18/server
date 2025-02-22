import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId, // References the user who owns the wishlist
      ref: "User", // Assumes a User collection exists
      required: true,
    },
    name: {
      type: String, // Name of the wishlist (e.g., "Birthday Wishlist", "Favorites")
      required: false,
      default: "My Wishlist",
      trim: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId, // References the products
          ref: "Products", // Assumes a Product collection exists
          required: true,
        },
        addedAt: {
          type: Date, // Timestamp of when the item was added to the wishlist
          default: Date.now,
        },
        notes: {
          type: String, // Optional notes or comments about the item
          trim: true,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

export default mongoose.model.wishlists ||
  mongoose.model("Wishlists", wishlistSchema);
