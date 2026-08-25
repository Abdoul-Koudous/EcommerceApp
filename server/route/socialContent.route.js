// server/route/socialContent.route.js
import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  generateContentForProduct,
  getContentForProduct,
  updateContentField,
} from "../controllers/socialContent.controller.js";

const socialContentRouter = Router();

// ✅ CORRIGÉ : adminAuth ajouté — génération et édition de contenu
// coûtent un appel LLM et sont des outils vendeur, pas des actions
// accessibles à n'importe quel client connecté.
socialContentRouter.post("/generate", auth, adminAuth, generateContentForProduct);
socialContentRouter.get("/product/:productId", auth, adminAuth, getContentForProduct);
socialContentRouter.put("/:id/field", auth, adminAuth, updateContentField);

export default socialContentRouter;