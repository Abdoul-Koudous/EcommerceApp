import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Veuillez indiquer votre nom"]
    },
    email: {
        type: String,
        required: [true, "Veuillez indiquer votre email"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Veuillez indiquer votre mot de passe"]
    },
    avatar: {
        type: String,
        default: ""
    },
    mobile: {
        type: String,
        default: ""
    },
    verify_email: {
        type: Boolean,
        default: false
    },
    access_token:{
        type: String,
        default: ''
    },
    refresh_token:{
        type: String,
        default: ''
    },
    last_login_date: {
        type: Date,
        default: ""
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Suspendu"],
        default: "Active"
    },
    address_details:[ {
        type: mongoose.Schema.ObjectId,
        ref: 'Address'
    }],
    shopping_cart: [{
        type: mongoose.Schema.ObjectId,
        ref: 'cartProduit'
    }],
    orderHistory:[ {
        type: mongoose.Schema.ObjectId,
        ref: 'Commande'
    }],
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    otpAttempts: {                          // ✅ ajouté — anti brute-force sur l'OTP
        type: Number,
        default: 0
    },
    resetPasswordToken: {                   // ✅ ajouté — hash du token émis après OTP validé
        type: String
    },
    resetPasswordTokenExpires: {            // ✅ ajouté — expiration du token de reset
        type: Date
    },
    role: {
        type: String,
        enum: ['ADMIN', "UTILISATEUR"],
        default: "UTILISATEUR"
    },
    signUpWithGoogle: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const UserModel = mongoose.model("Utilisateur", userSchema);
export default UserModel;