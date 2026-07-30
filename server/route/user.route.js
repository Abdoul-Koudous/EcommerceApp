import { Router } from 'express';
import {
    addReview,
    authWithGoogle,
    deleteMultipleUsersController,
    deleteUserController,
    forgotPasswordController,
    getAllUsersController,
    getReviews,
    loginUserController,
    logoutController,
    refreshToken,
    registerUserController,
    removeImageFromCloudinary,
    resetpassword,
    updateUserDetails,
    userAvatarController,
    UserDetails,
    verifyEmailController,
    verifyForgotPasswordOtp
} from '../controllers/user.controller.js';

import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';

const userRouter = Router();

// ROUTES FIXES EN PREMIER
userRouter.post('/register', registerUserController);
userRouter.post('/verifyEmail', verifyEmailController);
userRouter.post('/login', loginUserController);
userRouter.post('/authWithGoogle', authWithGoogle);
userRouter.get('/logout', auth, logoutController);

userRouter.put('/user-avatar', auth, upload.array('avatar'), userAvatarController);
userRouter.delete('/deleteImage', auth, removeImageFromCloudinary);

userRouter.post('/forgot-password', forgotPasswordController);
userRouter.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
userRouter.post('/reset-password', resetpassword);
userRouter.post('/refresh-token', refreshToken);
userRouter.get('/user-details', auth, UserDetails);
userRouter.post('/addReview', auth, addReview);
userRouter.get('/getReviews', auth, getReviews);

// Liste des utilisateurs (admin, paginée + recherche)
userRouter.get('/lists', auth, adminAuth, getAllUsersController);

// Suppression multiple AVANT la route dynamique /:id
userRouter.delete('/deleteMultipleUsers', auth, adminAuth, deleteMultipleUsersController);

// ROUTES DYNAMIQUES À LA FIN
userRouter.put('/:id', auth, updateUserDetails);
userRouter.delete('/:id', auth, adminAuth, deleteUserController);

export default userRouter;