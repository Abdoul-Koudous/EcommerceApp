import mongoose from "mongoose";

const addressSchema = mongoose.Schema({
    name: {
        type: String,
        default: ""
    },
    address_line1: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    pincode: {
        type: String,
    },
    country: {
        type: String,
    },
    mobile: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true
    },
    selected: {
        type: Boolean,
        default: false
    },
    landmark: {
        type: String
    },
    addressType: {
        type: String,
        enum: ["Maison", "Bureau"]
    },
    userId: {
        type: String,
        default: ""
    },
}, { timestamps: true });

const AddressModel = mongoose.model("Address", addressSchema);
export default AddressModel;