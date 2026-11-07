// server/route/campaign.route.js
import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  createCampaign,
  getAllCampaigns,
  resolveShortLink,
  trackEvent,
  getCampaignAnalytics,   // ✅ NOUVEAU
  getAnalyticsOverview,   // ✅ NOUVEAU
} from "../controllers/campaign.controller.js";

const campaignRouter = Router();

campaignRouter.post("/create", auth, adminAuth, createCampaign);
campaignRouter.get("/getAll", auth, adminAuth, getAllCampaigns);
campaignRouter.post("/track", trackEvent); // pas d'auth obligatoire : visiteur anonyme possible
campaignRouter.get("/analytics-overview", auth, adminAuth, getAnalyticsOverview);
campaignRouter.get("/analytics/:campaignId", auth, adminAuth, getCampaignAnalytics);


export default campaignRouter;