// server/route/shortLink.route.js — routeur SÉPARÉ, monté à la racine (pas sous /api)
import { Router } from "express";
import { resolveShortLink } from "../controllers/campaign.controller.js";

const shortLinkRouter = Router();

shortLinkRouter.get("/:slug", resolveShortLink);

export default shortLinkRouter;