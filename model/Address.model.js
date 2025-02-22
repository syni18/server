import mongoose from "mongoose";

const AddressesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    defaultAddress: {
        id: {
            type: String,
            unique: true,
        },
        fullName: String,
        phoneNumber: String,
        pincode: String,
        locality: String,
        address: String,
        cityDistrictTown: String,
        state: String,
        landmark: String,
        addressType: String,
        altMobile: String, 
    },
    addresses: [
        {
            id: {
                type: String,
                unique: true,
            },
            fullName: String,
            phoneNumber: String,
            pincode: String,
            locality: String,
            address: String,
            cityDistrictTown: String,
            state: String,
            landmark: String,
            addressType: String,
            altMobile: String, // for secondary mobile numbers, if any
        },
    ],
});


export default mongoose.model.addresses ||
  mongoose.model("Addresses", AddressesSchema);
