import ShippingZoneModel from "../models/shippingZone.model.js";

export async function getAllShippingZones(request, response) {
  try {
    const zones = await ShippingZoneModel.find().sort({ city: 1 });

    return response.status(200).json({
      error: false,
      success: true,
      zones,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function createShippingZone(request, response) {
  try {
    const { city, fee } = request.body;

    if (!city || fee === undefined) {
      return response.status(400).json({
        message: "La ville et le montant sont requis",
        error: true,
        success: false,
      });
    }

    let zone = new ShippingZoneModel({ city, fee });
    zone = await zone.save();

    return response.status(200).json({
      error: false,
      success: true,
      message: "Zone de livraison créée avec succès",
      zone,
    });
  } catch (error) {
    // ✅ code 11000 = violation de l'index unique sur "city"
    if (error.code === 11000) {
      return response.status(400).json({
        message: "Une zone existe déjà pour cette ville",
        error: true,
        success: false,
      });
    }
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function updateShippingZone(request, response) {
  try {
    const { city, fee } = request.body;

    const zone = await ShippingZoneModel.findByIdAndUpdate(
      request.params.id,
      { city, fee },
      { new: true },
    );

    if (!zone) {
      return response.status(404).json({
        message: "Zone introuvable",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      message: "Zone de livraison mise à jour",
      zone,
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(400).json({
        message: "Une zone existe déjà pour cette ville",
        error: true,
        success: false,
      });
    }
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function deleteShippingZone(request, response) {
  try {
    const zone = await ShippingZoneModel.findByIdAndDelete(request.params.id);

    if (!zone) {
      return response.status(404).json({
        message: "Zone introuvable",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      message: "Zone de livraison supprimée",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function deleteMultipleShippingZones(request, response) {
  const { ids } = request.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return response.status(400).json({
      message: "Aucun ID fourni",
      error: true,
      success: false,
    });
  }

  try {
    await ShippingZoneModel.deleteMany({ _id: { $in: ids } });

    return response.status(200).json({
      message: "Zones supprimées avec succès",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Erreur serveur",
      error: true,
      success: false,
    });
  }
}