// import moongoose
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    // prepare coupons schema
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    // required: true
  },
  type: {
    type: String,
  },
  discount: {
    type: Number,
    required: false
  },
  expirationDate: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }

})

export default mongoose.model.coupons || 
   mongoose.model("Coupons", couponSchema);