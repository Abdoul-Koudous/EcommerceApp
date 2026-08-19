import SettingsModel from "../models/settings.model.js";

// ✅ Même logique d'upsert que dans pricing.service.js : le document est
// créé avec les valeurs par défaut du schéma s'il n'existe pas encore.
export async function getSettings(request, response) {
  try {
    const settings = await SettingsModel.findOneAndUpdate(
      { key: "singleton" },
      { $setOnInsert: { key: "singleton" } },
      { new: true, upsert: true },
    );

    return response.status(200).json({
      error: false,
      success: true,
      settings,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function updateSettings(request, response) {
  try {
    const { defaultTaxRate, defaultShippingFee, currency } = request.body;

    const settings = await SettingsModel.findOneAndUpdate(
      { key: "singleton" },
      {
        ...(defaultTaxRate !== undefined && { defaultTaxRate }),
        ...(defaultShippingFee !== undefined && { defaultShippingFee }),
        ...(currency !== undefined && { currency }),
      },
      { new: true, upsert: true },
    );

    return response.status(200).json({
      error: false,
      success: true,
      message: "Paramètres mis à jour avec succès",
      settings,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}