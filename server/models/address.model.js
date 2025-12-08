import mongoose from "mongoose";

const addressSchema = mongoose.Schema({
    address_line1: {
        type : String,
        default: ""
    },
    city : {
        type : String,
        default: ""
    },
    state : {
        type : String,
        default: ""
    },
    pincode : {
        type : String,
        
    },
    country : {
        type : String,
        
    },
    mobile: {
        type: String,
        default: ""
    },
    status : {
        type : Boolean,
        default: true
    },
    selected : {
        type : Boolean,
        default: true
    },
    userId : {
        type : mongoose.Schema.ObjectId,
        default: ""
    },

},
    {timestamps: true}
)
const AddressModel =mongoose.model("Address", addressSchema);
export default AddressModel