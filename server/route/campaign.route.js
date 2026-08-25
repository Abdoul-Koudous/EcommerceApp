// server/route/campaign.route.js
import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  createCampaign,
  getAllCampaigns,
  resolveShortLink,
  trackEvent,
  getCampaignAnalytics,   // ✅ NOUVEAU
  getAnalyticsOverview,   // ✅ NOUVEAU
} from "../controllers/campaign.controller.js";

const campaignRouter = Router();

campaignRouter.post("/create", auth, createCampaign);
campaignRouter.get("/getAll", auth, getAllCampaigns);
campaignRouter.post("/track", trackEvent); // pas d'auth obligatoire : visiteur anonyme possible
campaignRouter.get("/analytics-overview", auth, getAnalyticsOverview);    // ✅ NOUVEAU
campaignRouter.get("/analytics/:campaignId", auth, getCampaignAnalytics); // ✅ NOUVEAU


export default campaignRouter;