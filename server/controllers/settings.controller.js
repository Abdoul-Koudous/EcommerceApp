import {
  getOrCreateSettings,
  normalizePaymentMethods,
  normalizeStoreIdentity,
  parsePaymentMethodsPayload,
  parseStoreIdentityPayload,
} from "../services/settings.service.js";
import {
  removeFromCloudinary,
  uploadFromBuffer,
} from "../utils/cloudinaryUpload.js";

const toPublicSettings = (settings) => {
  const doc = settings.toObject ? settings.toObject() : settings;
  return {
    ...doc,
    paymentMethods: normalizePaymentMethods(doc.paymentMethods),
    storeIdentity: normalizeStoreIdentity(doc.storeIdentity),
  };
};

export async function getSettings(request, response) {
  try {
    const settings = await getOrCreateSettings();

    return response.status(200).json({
      error: false,
      success: true,
      settings: toPublicSettings(settings),
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
    const {
      defaultTaxRate,
      defaultShippingFee,
      currency,
      paymentMethods,
      storeIdentity,
    } = request.body;

    const parsedPaymentMethods = parsePaymentMethodsPayload(paymentMethods);
    const parsedStoreIdentity = parseStoreIdentityPayload(storeIdentity);

    const settings = await getOrCreateSettings();

    if (defaultTaxRate !== undefined) settings.defaultTaxRate = defaultTaxRate;
    if (defaultShippingFee !== undefined) {
      settings.defaultShippingFee = defaultShippingFee;
    }
    if (currency !== undefined) settings.currency = currency;
    if (parsedPaymentMethods !== undefined) {
      settings.paymentMethods = parsedPaymentMethods;
    }
    if (parsedStoreIdentity !== undefined) {
      for (const [field, value] of Object.entries(parsedStoreIdentity)) {
        if (field === "socialLinks") {
          for (const [network, url] of Object.entries(value)) {
            settings.set(`storeIdentity.socialLinks.${network}`, url);
          }
        } else {
          settings.set(`storeIdentity.${field}`, value);
        }
      }
    }

    await settings.save();

    return response.status(200).json({
      error: false,
      success: true,
      message: "Paramètres mis à jour avec succès",
      settings: toPublicSettings(settings),
    });
  } catch (error) {
    return response.status(error.status || 500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function uploadStoreLogo(request, response) {
  try {
    const { variant } = request.params;
    if (!["logoLight", "logoDark"].includes(variant)) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Type de logo invalide",
      });
    }
    if (!request.file) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "Sélectionnez un fichier image",
      });
    }

    const settings = await getOrCreateSettings();
    const previousUrl = settings.storeIdentity?.[variant];
    const result = await uploadFromBuffer(
      request.file.buffer,
      request.file.originalname,
      "store-logo",
    );
    if (!result?.secure_url) {
      throw new Error("Cloudinary n'a pas retourné l'URL du logo");
    }

    settings.set(`storeIdentity.${variant}`, result.secure_url);
    await settings.save();

    if (previousUrl) {
      try {
        await removeFromCloudinary(previousUrl);
      } catch (cleanupError) {
        console.error("Impossible de supprimer l'ancien logo :", cleanupError);
      }
    }

    return response.status(200).json({
      error: false,
      success: true,
      message: "Logo mis à jour",
      logoUrl: result.secure_url,
      settings: toPublicSettings(settings),
    });
  } catch (error) {
    return response.status(error.status || 500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}
