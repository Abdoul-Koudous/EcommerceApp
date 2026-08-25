// server/controllers/campaign.controller.js
import crypto from "crypto";
import CampaignModel from "../models/campaign.model.js";
import CampaignLinkModel from "../models/campaignLink.model.js";
import TrackingEventModel from "../models/trackingEvent.model.js";
import ProductModel from "../models/product.model.js";
import mongoose from "mongoose";

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CHANNEL_SHORT = {
  whatsapp: "wa",
  instagram: "ig",
  facebook: "fb",
  tiktok: "tk",
};

// ✅ NOUVEAU : filtre partagé — un event PURCHASE ne compte dans les
// Analytics que s'il n'a pas été annulé ET s'il est confirmé payé
// (immédiat pour les paiements en ligne, différé à la livraison pour COD).
const VALID_PURCHASE_FILTER = { voided: { $ne: true }, confirmed: true };

export async function createCampaign(request, response) {
  try {
    const { name, products, channels } = request.body;

    if (!name || !Array.isArray(products) || products.length === 0) {
      return response.status(400).json({
        message: "Le nom et au moins un produit sont requis",
        error: true,
        success: false,
      });
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      return response.status(400).json({
        message: "Au moins un canal doit être sélectionné",
        error: true,
        success: false,
      });
    }

    const baseSlug = `${slugify(name)}-${crypto.randomBytes(2).toString("hex")}`;

    const campaign = await CampaignModel.create({
      name,
      products,
      channels,
      baseSlug,
    });

    const productDocs = await ProductModel.find({ _id: { $in: products } }).select("name");
    const productNameMap = Object.fromEntries(
      productDocs.map((p) => [p._id.toString(), p.name]),
    );

    const linksToCreate = [];

    for (const productId of products) {
      const productSlug = slugify(productNameMap[productId] || "produit").slice(0, 20);

      for (const channel of channels) {
        const shortChannel = CHANNEL_SHORT[channel] || channel;
        const slug = `${baseSlug}-${productSlug}-${shortChannel}`;

        linksToCreate.push({
          campaignId: campaign._id,
          productId,
          channel,
          slug,
          utm_source: channel,
          utm_medium: "social",
          utm_campaign: baseSlug,
        });
      }
    }

    const createdLinks = await CampaignLinkModel.insertMany(linksToCreate);

    return response.status(200).json({
      message: "Campagne créée avec succès",
      error: false,
      success: true,
      campaign,
      links: createdLinks,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getAllCampaigns(request, response) {
  try {
    const campaigns = await CampaignModel.find()
      .populate("products", "name images price")
      .sort({ createdAt: -1 });

    const campaignIds = campaigns.map((c) => c._id);
    const links = await CampaignLinkModel.find({
      campaignId: { $in: campaignIds },
    });

    const linksByCampaign = links.reduce((acc, link) => {
      const key = link.campaignId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(link);
      return acc;
    }, {});

    const result = campaigns.map((c) => ({
      ...c.toObject(),
      links: linksByCampaign[c._id.toString()] || [],
    }));

    return response.status(200).json({
      error: false,
      success: true,
      campaigns: result,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function resolveShortLink(request, response) {
  try {
    const { slug } = request.params;

    const link = await CampaignLinkModel.findOne({ slug, isActive: true });

    if (!link) {
      return response.redirect(`${process.env.CLIENT_URL}/`);
    }

    await Promise.all([
      CampaignLinkModel.updateOne({ _id: link._id }, { $inc: { clickCount: 1 } }),
      TrackingEventModel.create({
        type: "VISIT",
        productId: link.productId,
        campaignId: link.campaignId,
        campaignLinkId: link._id,
        source: link.utm_source,
        medium: link.utm_medium,
        campaign: link.utm_campaign,
      }),
    ]);

    const redirectUrl = `${process.env.CLIENT_URL}/product/${link.productId}?utm_source=${link.utm_source}&utm_medium=${link.utm_medium}&utm_campaign=${link.utm_campaign}&clid=${link._id}`;

    return response.redirect(302, redirectUrl);
  } catch (error) {
    return response.redirect(`${process.env.CLIENT_URL}/`);
  }
}

export async function trackEvent(request, response) {
  try {
    const {
      type,
      productId,
      campaignId,
      campaignLinkId,
      source,
      medium,
      campaign,
      sessionId,
      orderId,
      amount,
      confirmed, // ✅ NOUVEAU
    } = request.body;

    if (!type) {
      return response.status(400).json({
        message: "Le type d'événement est requis",
        error: true,
        success: false,
      });
    }

    let resolvedCampaignId = campaignId;
    if (!resolvedCampaignId && campaignLinkId) {
      const link = await CampaignLinkModel.findById(campaignLinkId).select("campaignId");
      resolvedCampaignId = link?.campaignId;
    }

    await TrackingEventModel.create({
      type,
      productId: productId || undefined,
      campaignId: resolvedCampaignId || undefined,
      campaignLinkId: campaignLinkId || undefined,
      source,
      medium,
      campaign,
      sessionId,
      userId: request.userId || undefined,
      orderId,
      amount,
      // ✅ NOUVEAU : par défaut true (paiement en ligne déjà encaissé) sauf
      // si explicitement précisé false (ex: paiement à la livraison)
      confirmed: confirmed === undefined ? true : confirmed,
    });

    return response.status(200).json({
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

export async function getCampaignAnalytics(request, response) {
  try {
    const { campaignId } = request.params;

    const events = await TrackingEventModel.aggregate([
      {
        $match: {
          campaignId: new mongoose.Types.ObjectId(campaignId),
          ...VALID_PURCHASE_FILTER, // ✅ NOUVEAU : exclut annulés + non confirmés
        },
      },
      {
        $group: {
          _id: { source: "$source", type: "$type" },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
    ]);

    const byChannel = {};

    for (const row of events) {
      const source = row._id.source || "direct";
      const type = row._id.type;

      if (!byChannel[source]) {
        byChannel[source] = {
          VISIT: 0,
          PRODUCT_VIEW: 0,
          ADD_TO_CART: 0,
          PURCHASE: 0,
          revenue: 0,
        };
      }

      byChannel[source][type] = row.count;
      if (type === "PURCHASE") {
        byChannel[source].revenue = row.revenue || 0;
      }
    }

    const result = Object.entries(byChannel).map(([channel, data]) => ({
      channel,
      visits: data.VISIT,
      productViews: data.PRODUCT_VIEW,
      addToCart: data.ADD_TO_CART,
      purchases: data.PURCHASE,
      revenue: data.revenue,
      conversionRate:
        data.VISIT > 0 ? Math.round((data.PURCHASE / data.VISIT) * 1000) / 10 : 0,
    }));

    return response.status(200).json({
      error: false,
      success: true,
      channels: result,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAnalyticsOverview(request, response) {
  try {
    // ⚠️ Ce $match s'applique à TOUS les types d'events, pas seulement
    // PURCHASE. voided/confirmed ne concernent que les PURCHASE en
    // pratique (les autres types restent confirmed:true, voided:false
    // par défaut), donc le filtre reste sûr à appliquer globalement ici.
    const channelEvents = await TrackingEventModel.aggregate([
      { $match: VALID_PURCHASE_FILTER },
      {
        $group: {
          _id: { source: "$source", type: "$type" },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
    ]);

    const byChannel = {};
    for (const row of channelEvents) {
      const source = row._id.source || "direct";
      const type = row._id.type;

      if (!byChannel[source]) {
        byChannel[source] = {
          VISIT: 0,
          PRODUCT_VIEW: 0,
          ADD_TO_CART: 0,
          PURCHASE: 0,
          revenue: 0,
        };
      }
      byChannel[source][type] = row.count;
      if (type === "PURCHASE") {
        byChannel[source].revenue = row.revenue || 0;
      }
    }

    const channels = Object.entries(byChannel).map(([channel, data]) => ({
      channel,
      visits: data.VISIT,
      productViews: data.PRODUCT_VIEW,
      addToCart: data.ADD_TO_CART,
      purchases: data.PURCHASE,
      revenue: data.revenue,
      conversionRate:
        data.VISIT > 0 ? Math.round((data.PURCHASE / data.VISIT) * 1000) / 10 : 0,
    }));

    const topProductsAgg = await TrackingEventModel.aggregate([
      {
        $match: {
          type: "PURCHASE",
          productId: { $ne: null },
          ...VALID_PURCHASE_FILTER, // ✅ NOUVEAU
        },
      },
      {
        $group: {
          _id: "$productId",
          purchases: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const topProductIds = topProductsAgg.map((p) => p._id);
    const productDocs = await ProductModel.find({
      _id: { $in: topProductIds },
    }).select("name images");
    const productMap = Object.fromEntries(
      productDocs.map((p) => [p._id.toString(), p]),
    );

    const topProducts = topProductsAgg.map((p) => ({
      productId: p._id,
      name: productMap[p._id?.toString()]?.name || "Produit supprimé",
      image: productMap[p._id?.toString()]?.images?.[0] || "",
      purchases: p.purchases,
      revenue: p.revenue,
    }));

    const topCampaignsAgg = await TrackingEventModel.aggregate([
      {
        $match: {
          type: "PURCHASE",
          campaignId: { $ne: null },
          ...VALID_PURCHASE_FILTER, // ✅ NOUVEAU
        },
      },
      {
        $group: {
          _id: "$campaignId",
          purchases: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const topCampaignIds = topCampaignsAgg.map((c) => c._id);
    const campaignDocs = await CampaignModel.find({
      _id: { $in: topCampaignIds },
    }).select("name");
    const campaignMap = Object.fromEntries(
      campaignDocs.map((c) => [c._id.toString(), c]),
    );

    const topCampaigns = topCampaignsAgg.map((c) => ({
      campaignId: c._id,
      name: campaignMap[c._id?.toString()]?.name || "Campagne supprimée",
      purchases: c.purchases,
      revenue: c.revenue,
    }));

    const totalVisits = channels.reduce((sum, c) => sum + c.visits, 0);
    const totalPurchases = channels.reduce((sum, c) => sum + c.purchases, 0);
    const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);

    return response.status(200).json({
      error: false,
      success: true,
      totals: {
        visits: totalVisits,
        purchases: totalPurchases,
        revenue: totalRevenue,
        conversionRate:
          totalVisits > 0
            ? Math.round((totalPurchases / totalVisits) * 1000) / 10
            : 0,
      },
      channels,
      topProducts,
      topCampaigns,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}