import UserModel from '../models/user.model.js'

const adminAuth = async (request, response, next) => {
    try {
        // request.userId doit déjà être défini par le middleware auth (à chaîner avant celui-ci)
        const userId = request.userId

        if (!userId) {
            return response.status(401).json({
                message: "Fournir un jeton",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findById(userId)

        if (!user) {
            return response.status(404).json({
                message: "Utilisateur introuvable",
                error: true,
                success: false
            })
        }

        if (user.role !== 'ADMIN') {
            return response.status(403).json({
                message: "Accès réservé aux administrateurs",
                error: true,
                success: false
            })
        }

        // On attache l'utilisateur complet si besoin plus loin dans le contrôleur
        request.user = user
        next()

    } catch (error) {
        return response.status(500).json({
            message: "Erreur lors de la vérification des droits administrateur",
            error: true,
            success: false
        })
    }
}

export default adminAuth