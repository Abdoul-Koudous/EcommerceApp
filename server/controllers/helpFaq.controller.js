import HelpFaqModel from "../models/helpFaq.model.js";

export async function addFaq(req, res) {
  try {
    const {
      category,
      categoryIcon,
      categoryDescription,
      question,
      answer,
      status,
      order,
    } = req.body;

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "La catégorie est requise",
      });
    }

    if (!categoryIcon?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "L'icône de catégorie est requise",
      });
    }

    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "La question est requise",
      });
    }

    if (!answer?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "La réponse est requise",
      });
    }

    const faq = new HelpFaqModel({
      category: category.trim(),
      categoryIcon: categoryIcon.trim(),
      categoryDescription: categoryDescription?.trim() || "",
      question: question.trim(),
      answer: answer.trim(),
      status: ["draft", "published"].includes(status) ? status : "draft",
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    });

    const savedFaq = await faq.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "Question créée",
      faq: savedFaq,
    });
  } catch (error) {
    console.error("Erreur création FAQ :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

/**
 * Liste publique — questions publiées uniquement.
 * Pas de pagination volontairement : le front fait la recherche et le
 * filtre par catégorie côté client sur la liste complète (autocomplétion
 * instantanée), comme dans le design d'origine.
 */
export async function getFaqs(req, res) {
  try {
    const filter = { status: "published" };

    if (req.query.category && req.query.category !== "Tous") {
      filter.category = req.query.category;
    }

    const faqs = await HelpFaqModel.find(filter).sort({
      category: 1,
      order: 1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      error: false,
      data: faqs,
    });
  } catch (error) {
    console.error("Erreur récupération FAQ :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

/**
 * Catégories distinctes (questions publiées uniquement), avec l'icône et
 * la description de la FAQ la plus ANCIENNE de chaque catégorie —
 * convention choisie pour rester stable même si de nouvelles questions
 * sont ajoutées ensuite avec des valeurs différentes par erreur.
 */
export async function getCategories(req, res) {
  try {
    const categories = await HelpFaqModel.aggregate([
      { $match: { status: "published" } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$category",
          icon: { $first: "$categoryIcon" },
          description: { $first: "$categoryDescription" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = categories.map((c) => ({
      key: c._id,
      title: c._id,
      icon: c.icon,
      description: c.description,
    }));

    return res.status(200).json({
      success: true,
      error: false,
      categories: formatted,
    });
  } catch (error) {
    console.error("Erreur récupération catégories FAQ :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

/**
 * Admin — liste complète (brouillons + publiées), avec pagination et filtres.
 */
export async function getFaqsAdmin(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const perPage = Math.max(parseInt(req.query.perPage) || 10, 1);

    const filter = {};

    if (req.query.status && ["draft", "published"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.category && req.query.category !== "Tous") {
      filter.category = req.query.category;
    }

    if (req.query.search?.trim()) {
      const search = req.query.search.trim();

      filter.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const total = await HelpFaqModel.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / perPage), 1);

    const faqs = await HelpFaqModel.find(filter)
      .sort({ category: 1, order: 1, createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    return res.status(200).json({
      success: true,
      error: false,
      data: faqs,
      total,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

export async function getFaqAdmin(req, res) {
  try {
    const faq = await HelpFaqModel.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Question introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      faq,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

export async function updateFaq(req, res) {
  try {
    const existingFaq = await HelpFaqModel.findById(req.params.id);

    if (!existingFaq) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Question introuvable",
      });
    }

    const updateData = {};

    if (req.body.category !== undefined) {
      updateData.category = req.body.category.trim();
    }

    if (req.body.categoryIcon !== undefined) {
      updateData.categoryIcon = req.body.categoryIcon.trim();
    }

    if (req.body.categoryDescription !== undefined) {
      updateData.categoryDescription = req.body.categoryDescription.trim();
    }

    if (req.body.question !== undefined) {
      updateData.question = req.body.question.trim();
    }

    if (req.body.answer !== undefined) {
      updateData.answer = req.body.answer.trim();
    }

    if (req.body.status !== undefined) {
      if (["draft", "published"].includes(req.body.status)) {
        updateData.status = req.body.status;
      }
    }

    if (req.body.order !== undefined) {
      updateData.order = Number.isFinite(Number(req.body.order))
        ? Number(req.body.order)
        : 0;
    }

    const updatedFaq = await HelpFaqModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      error: false,
      message: "Question mise à jour",
      faq: updatedFaq,
    });
  } catch (error) {
    console.error("Erreur mise à jour FAQ :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

export async function deleteFaq(req, res) {
  try {
    const faq = await HelpFaqModel.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Question introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "Question supprimée",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}