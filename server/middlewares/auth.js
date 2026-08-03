import { request, response } from 'express'
import jwt from 'jsonwebtoken'

const auth = async(request,response,next)=>{
    try {
        const authHeader = request.headers?.authorization;
        let token = request.cookies?.accessToken || (authHeader && authHeader.split(" ")[1]);

        // ✅ le front envoie parfois "Bearer null" quand personne n'est connecté
        // (localStorage.getItem renvoie null, transformé en string dans le header) —
        // on le traite comme une absence de token, pas comme un vrai jeton à décoder
        if (token === "null" || token === "undefined") {
            token = null;
        }

        if(!token){
            return response.status(401).json({
                message : "Fournir un jeton",
                error: true,
                success: false
            })
        }

        const decode = await jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
        if(!decode){
            return response.status(401).json({
                message : "Accès non autoriser",
                error: true,
                success : false
            })
        }
        request.userId = decode.id
        next()

    } catch (error) {
        // ✅ un jwt invalide/expiré/malformé est un problème d'authentification,
        // pas une erreur serveur — 401 est le code HTTP correct, pas 500
        return response.status(401).json({
            message : "Vous n'êtes pas connecté",
            error : true,
            success : false
        })
    }
}

export default auth