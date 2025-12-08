import { request, response } from 'express'
import jwt from 'jsonwebtoken'

const auth = async(request,response,next)=>{
    try {
        const authHeader = request.headers?.authorization;
        const token = request.cookies?.accessToken || (authHeader && authHeader.split(" ")[1]);


        // if(!token){
        //     token = request.query.token;
        // }

        if(!token){
            return response.status(401).json({
                message : "Fournir un jeton"
            })
        }

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN);
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
        return response.status(500).json({
            message : "Vous n'ête pas connecter",
            error : true,
            success : false
        })
        
    }
}

export default auth