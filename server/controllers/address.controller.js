import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js";

export const addAddressController = async (request, response) => {
    try {
        const { address_line1, city, state, pincode, country, mobile, landmark, addressType, name } = request.body;
        const userId = request.userId;

        if (!address_line1 || !city || !state || !pincode || !country || !mobile) {
            return response.status(400).json({
                message: "Veuillez fournir tous les champs requis",
                error: true,
                success: false
            });
        }

        const address = new AddressModel({
            address_line1, city, state, pincode, country, mobile, userId, landmark, addressType, name
        });

        const savedAddress = await address.save();

        await UserModel.updateOne({ _id: userId }, {
            $push: { address_details: savedAddress?._id }
        });

        return response.status(200).json({
            data: savedAddress,
            message: "Adresse ajoutée avec succès",
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
};

export const getAddressController = async (request, response) => {
    try {
        const addresses = await AddressModel.find({ userId: request?.query?.userId });

        return response.status(200).json({
            data: addresses,
            message: "Adresse(s) récupérée(s) avec succès",
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
};

export const deleteAddressController = async (req, res) => {
    try {
        const userId = req.userId;
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                message: "ID manquant",
                error: true,
                success: false,
            });
        }

        const deleted = await AddressModel.deleteOne({ _id: id, userId: userId });

        if (deleted.deletedCount === 0) {
            return res.status(404).json({
                message: "Adresse introuvable",
                error: true,
                success: false,
            });
        }

        return res.json({
            message: "Adresse supprimée avec succès",
            error: false,
            success: true,
            data: deleted,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

export const selectAddressController = async (request, response) => {
    try {
        const userId = request.userId;
        const addressId = request.params.id;

        const address = await AddressModel.findOne({ _id: addressId, userId });

        if (!address) {
            return response.status(404).json({
                message: "Adresse introuvable",
                error: true,
                success: false
            });
        }

        // On désélectionne toutes les adresses de l'utilisateur
        await AddressModel.updateMany(
            { userId },
            { selected: false }
        );

        // On sélectionne uniquement celle demandée
        const updated = await AddressModel.findByIdAndUpdate(
            addressId,
            { selected: true },
            { new: true }
        );

        return response.status(200).json({
            error: false,
            success: true,
            data: updated
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const updateAddressController = async (request, response) => {
    try {
        const userId = request.userId;
        const id = request.params.id;

        const { name, address_line1, city, state, pincode, country, mobile, landmark, addressType, status } = request.body;

        if (!address_line1 || !city || !state || !pincode || !country || !mobile) {
            return response.status(400).json({
                message: "Veuillez fournir tous les champs requis",
                error: true,
                success: false
            });
        }

        const updated = await AddressModel.findOneAndUpdate(
            { _id: id, userId },
            { name, address_line1, city, state, pincode, country, mobile, landmark, addressType, status },
            { new: true }
        );

        if (!updated) {
            return response.status(404).json({
                message: "Adresse introuvable",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            data: updated,
            message: "Adresse mise à jour avec succès",
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
};