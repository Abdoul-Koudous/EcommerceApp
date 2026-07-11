import UserModel from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmailFun from "../config/sendEmail.js";
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from "../utils/generatedAccessToken.js";
import generatedRefreshToken from "../utils/generatedRefreshToken.js";
import { v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import { match } from "assert";
import { text } from "stream/consumers";
import { error } from "console";
import ReviewsModel from "../models/reviews.model.js";

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
})

export async function registerUserController(request, response) {
    try {
        const { name, email, password } = request.body;

        if (!name || !email || !password) {
            return response.status(400).json({
                message: "Indiquer votre email, nom et mot de passe",
                error: true,
                success: false
            });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return response.status(400).json({
                message: "Cet email est déjà enregistré",
                error: true,
                success: false
            });
        }

        // Générer un code de vérification
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Hasher le mot de passe
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Créer le nouvel utilisateur
        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            otp: verifyCode,
            otpExpires: Date.now() + 600000 // 10 minutes
        });

        await newUser.save();

        // Envoyer l'email de vérification
        await sendEmailFun(
            email,
            "Vérification de votre email sur YebouShop",
            "",
            VerificationEmail(name, verifyCode)
        );

        // Générer le token JWT
        const token = jwt.sign(
            { email: newUser.email, id: newUser._id },
            process.env.JSON_WEB_TOKEN_SECRET_KEY,
            { expiresIn: '7d' }
        );

        return response.status(201).json({
            success: true,
            error: false,
            message: "Inscription réussie, veuillez vérifier votre email.",
            token
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function verifyEmailController(request, response) {
    try {
        const { email, otp } = request.body;

        // Vérifier si l'utilisateur existe
        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        // Vérifier si l'OTP correspond
        const isCodeValid = user.otp === otp;

        // Vérifier si l'OTP n'est pas expiré
        const isNotExpired = user.otpExpires && user.otpExpires > Date.now();

        if (!isCodeValid) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "OTP invalide"
            });
        }

        if (!isNotExpired) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "OTP expiré"
            });
        }

        // Si tout est bon → valider l'email
        user.verify_email = true;
        user.otp = null;
        user.otpExpires = null;

        await user.save();

        return response.status(200).json({
            error: false,
            success: true,
            message: "Email vérifié avec succès"
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


export async function authWithGoogle(request, response){
    const {name, email, password,avatar, mobile, role} = request.body;

    try {
        const existingUser = await UserModel.findOne({ email });

        if (!existingUser) {
            const user = await UserModel.create({
                name: name,
                mobile: mobile,
                email: email,
                password: "null",
                avatar: avatar,
                role: role,
                verify_email: true,
                signUpWithGoogle:true,
            });
            await user.save();
            const accesstoken = await generatedAccessToken(user._id);
            const refreshToken = await generatedRefreshToken(user._id);
            await UserModel.findByIdAndUpdate(user?._id,{
                last_login_date : new Date()
            })

            const cookiesOption = {
                httpOnly : true,
                secure : true,
                sameSite : "None"
            }
            response.cookie('accessToken',accesstoken,cookiesOption)
            response.cookie('refreshToken',refreshToken,cookiesOption)

            return response.json({
                message : "La connexion faite avec succès",
                error: false,
                success : true,
                data : {
                    accesstoken,
                    refreshToken
                }
            })
            
        }else{
           const accesstoken = await generatedAccessToken(existingUser._id);
            const refreshToken = await generatedRefreshToken(existingUser._id);
            await UserModel.findByIdAndUpdate(existingUser?._id,{
                last_login_date : new Date()
            })

            const cookiesOption = {
                httpOnly : true,
                secure : true,
                sameSite : "None"
            }
            response.cookie('accessToken',accesstoken,cookiesOption)
            response.cookie('refreshToken',refreshToken,cookiesOption)

            return response.json({
                message : "La connexion faite avec succès",
                error: false,
                success : true,
                data : {
                    accesstoken,
                    refreshToken
                }
            })
        }
        
    } catch (error) {
         return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
        
    }
}

export async function loginUserController(request, response) {
   try {

        const {email, password} =  request.body;
        const user = await UserModel.findOne({email:email});

        if(!user){
            return response.status(400).json({
                message: "L'utilisateur n'est pas enregistrer",
                error:true,
                success:false
            })
        }

        if (user.status!=="Active"){
            return response.status(400).json({
                message: "Contactez l'administrateur",
                error:true,
                success:false
            })
        }

        if (user.verify_email!==true){
            return response.status(400).json({
                message: "Votre email n'est pas été verifier",
                error:true,
                success:false
            })
        }

        const checkPassword = await bcryptjs.compare(password, user.password);

        if(!checkPassword){
            return response.status(400).json({
                message: "Verifier votre mot de passe",
                error:true,
                success:false
            })

        }

        const accesstoken = await generatedAccessToken(user._id);
        const refreshToken = await generatedRefreshToken(user._id);
        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date()
        })

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }
        response.cookie('accessToken',accesstoken,cookiesOption)
        response.cookie('refreshToken',refreshToken,cookiesOption)

        return response.json({
            message : "La connexion faite avec succès",
            error: false,
            success : true,
            data : {
                accesstoken,
                refreshToken
            }
        })
   } catch (error) {
    return response.status(500).json({
        message : error.message || error,
        error : true,
        success : false
    })
    
   }
    
}

export async function logoutController(request,response) {
    try {
        const userid = request.userId
        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.clearCookie("accessToken", cookiesOption)
        response.clearCookie("refreshToken", cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
            refresh_token : ""
        })
        return response.json({
            message : "Deconnexion faite avec succès",
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
        
    }
    
}

var imagesArr = [];
export async function userAvatarController(request, response) {
    try {
        imagesArr = [];

        const userId = request.userId;
        const image = request.files;

        const user = await UserModel.findOne({ _id: userId });

        if (!user) {
            return response.status(500).json({
                message: "Utilisateur introuvable",
                error: true,
                success: false
            });
        }

        // --- SUPPRESSION DE L’ANCIEN AVATAR ---
        const imgUrl = user.avatar;

        if (imgUrl) {
            const urlArr = imgUrl.split("/");
            const avatar_image = urlArr[urlArr.length - 1];
            const imageName = avatar_image.split(".")[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

        // --- UPLOAD DES NOUVEAUX AVATARS ---
        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < image?.length; i++) {
            await cloudinary.uploader.upload(
                image[i].path,
                options,
                function (error, result) {
                    imagesArr.push(result.secure_url);
                    fs.unlinkSync(`telechargements/${request.files[i].filename}`);
                }
            );
        }

        user.avatar = imagesArr[0];
        await user.save();

        return response.status(200).json({
            _id: userId,
            avatar: imagesArr[0]
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}



export async function removeImageFromCloudinary(request,response) {
    const imgUrl = request.query.img;
   
    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    if(imageName){
        const res = await cloudinary.uploader.destroy(
        imageName,
        (error, result) => {
            
        }
    );
    if (res){
        response.status(200).send(res);
    }
    }

}

export async function updateUserDetails(request, response) {
    try {
        const userId = request.userId;
        const { name, email, mobile, password } = request.body;

        // Vérifier que l'utilisateur existe
        const userExist = await UserModel.findById(userId);
        if (!userExist) {
            return response.status(400).json({
                message: "L'utilisateur ne peut pas être mis à jour",
                error: true,
                success: false
            });
        }

        // Validation du numéro de téléphone
        if (mobile) {
            const phoneRegex = /^\+?[0-9]{8,15}$/; // +optionnel, 8 à 15 chiffres
            if (!phoneRegex.test(mobile)) {
                return response.status(400).json({
                    message: "Numéro de téléphone invalide",
                    error: true,
                    success: false
                });
            }
        }

        // Générer OTP si email changé
        let verifyCode = "";
        if (email && email !== userExist.email) {
            verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        // Hasher le mot de passe si modifié
        let hashedPassword = userExist.password;
        if (password) {
            const salt = await bcryptjs.genSalt(10);
            hashedPassword = await bcryptjs.hash(password, salt);
        }

        // Envoyer l’email avec le code si email changé
        if (verifyCode !== "") {
            const emailSent = await sendEmailFun(
                email,
                "Vérification d'email Yeboushop",
                "",
                VerificationEmail(name || userExist.name, verifyCode)
            );

            if (!emailSent) {
                return response.status(500).json({
                    message: "Impossible d'envoyer le code de vérification",
                    error: true,
                    success: false
                });
            }
        }

        // Mise à jour de l'utilisateur
        const updateUser = await UserModel.findByIdAndUpdate(
            userId,
            {
                name: name || userExist.name,
                mobile: mobile || userExist.mobile,
                email: email || userExist.email,
                verify_email: verifyCode === "" ? userExist.verify_email : false,
                password: hashedPassword,
                otp: verifyCode !== "" ? verifyCode : null,
                otpExpires: verifyCode !== "" ? Date.now() + 600000 : null
            },
            { new: true }
        );

        return response.status(200).json({
            message: "L'utilisateur mis à jour avec succès",
            error: false,
            success: true,
            user: {
                name: updateUser?.name,
                _id: updateUser?._id,
                email: updateUser?.email,
                mobile: updateUser?.mobile,
                avatar: updateUser?.avatar,
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({
                message: "Email introuvable",
                error: true,
                success: false
            });
        }

        // Générer OTP
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = verifyCode;
        user.otpExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        // Envoyer email
        const emailSent = await sendEmailFun(
            email,
            "Réinitialisation de mot de passe - Yeboushop",
            "",
            VerificationEmail(user.name, verifyCode)
        );

        if (!emailSent) {
            return response.status(500).json({
                message: "Impossible d'envoyer l'email",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Un code de vérification a été envoyé à votre email",
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email, otp } = request.body;

        if (!email || !otp) {
            return response.status(400).json({
                message: "email et otp sont obligatoires",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email introuvable",
                error: true,
                success: false
            });
        }

        // Vérifier si le code correspond
        if (otp !== user.otp) {
            return response.status(400).json({
                message: "OTP invalide",
                error: true,
                success: false
            });
        }

        // Vérifier expiration
        if (Date.now() > user.otpExpires) {
            return response.status(400).json({
                message: "OTP expiré",
                error: true,
                success: false
            });
        }

        // Invalider le code
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        return response.status(200).json({
            message: "OTP vérifié avec succès",
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function resetpassword(request, response) {
  try {
    const { email, newPassword, confirmPassword } = request.body;

    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        message: "email, newPassword et confirmPassword sont obligatoires",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email introuvable",
        error: true,
        success: false,
      });
    }

    // Vérifier que les nouveaux mots de passe correspondent
    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "Les mots de passe ne correspondent pas",
        error: true,
        success: false,
      });
    }

    // Hash et mise à jour du mot de passe (plus de vérification de l'ancien mot de passe)
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);
    user.signUpWithGoogle = false;
    await user.save();

    return response.status(200).json({
      message: "Mot de passe modifié avec succès",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}


export async function refreshToken(request, response) {
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1]

        if(!refreshToken){
            return response.status(401).json({
                message: "Token invalide",
                error: true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN)
        if(!verifyToken){
            return response.status(401).json({
                message: "Token est expirer",
                error: true,
                success : false
            })
        }

        const userId = verifyToken.id;
        const newAccessToken = await generatedAccessToken(userId)

        const cookiesOption={
            httpOnly : true,
            secure : true,
            sameSite: "None"
        }
        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message: "Nouveau jeton d'accès généré",
            error : false,
            success: true,
            date : {
                accessToken : newAccessToken
            }
        })
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: error,
            success: false
        })
        
    }

    
}


export async function UserDetails(request, response) {
    try {
        const userId = request.userId

        console.log(userId)

        const user =await UserModel.findById(userId).select('-password -refresh_token').populate('address_details');

        return response.json({
            message: "Les details de l'utilisateurs",
            data: user,
            error: false,
            success: true
        })
        
    } catch (error) {
        return response.status(500).json({
            message: "Il ya un probleme",
            error: true,
            success: false
        })
        
    }
    
}

export async function addReview(request, response){
    try {
        const {image,userName, review, rating, userId,productId} = request.body;

        const userReview = new ReviewsModel({
            image: image,
            userName: userName,
            review: review,
            rating: rating,
            userId: userId,
            productId:productId,
        })
        await userReview.save();

        return response.json({
            message: "Merci pour votre avis",
            error: false,
            success: true,
            data: userReview
        })
        
    } catch (error) {
         return response.status(500).json({
            message: "Il ya un probleme",
            error: true,
            success: false
        })
        
    }
}

export async function getReviews(request, response){
    try {
        const { productId } = request.query;

        const reviews = await ReviewsModel.find({ productId });

        return response.status(200).json({
            message: "Liste des avis",
            error: false,
            success: true,
            reviews: reviews
        });

    } catch (error) {
        return response.status(500).json({
            message: "Il y a un problème",
            error: true,
            success: false
        });
    }
}