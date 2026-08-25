import BlogModel from "../models/blog.model.js";
import {
  uploadFromBuffer,
  removeFromCloudinary,
} from "../utils/cloudinaryUpload.js";

function collectBlogImageUrls(blog) {
  const urls = [];

  if (blog.image) {
    urls.push(blog.image);
  }

  for (const block of blog.body || []) {
    if (block.type === "image" && block.src) {
      urls.push(block.src);
    }
  }

  return [...new Set(urls)];
}

async function ensureSingleFeatured(excludeId = null) {
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};

  await BlogModel.updateMany(filter, {
    $set: {
      featured: false,
    },
  });
}

export async function uploadImages(req, res) {
  try {
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Aucune image fournie",
      });
    }

    const images = [];

    for (const file of files) {
      const result = await uploadFromBuffer(
        file.buffer,
        file.originalname,
        "blog"
      );

      images.push(result.secure_url);
    }

    return res.status(200).json({
      success: true,
      error: false,
      images,
    });
  } catch (error) {
    console.error("Erreur upload blog :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur lors de l'upload",
    });
  }
}

export async function addBlog(req, res) {
  try {
    const {
      title,
      excerpt,
      category,
      image,
      featured,
      status,
      readTime,
      date,
      author,
      body,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Le titre est requis",
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "La catégorie est requise",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "La couverture est requise",
      });
    }

    if (!Array.isArray(body) || body.length === 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Le contenu de l'article est requis",
      });
    }

    const isFeatured = Boolean(featured);

    if (isFeatured) {
      await ensureSingleFeatured();
    }

    const blog = new BlogModel({
      title: title.trim(),
      excerpt: excerpt?.trim() || "",
      category: category.trim(),
      image,
      featured: isFeatured,
      // ✅ AJOUT : statut, défaut "draft" géré par le modèle si absent
      status: ["draft", "published"].includes(status) ? status : "draft",
      readTime: Number(readTime) > 0 ? Number(readTime) : 1,
      date: date || Date.now(),
      author: {
        name: author?.name?.trim() || "",
        role: author?.role?.trim() || "",
      },
      body,
    });

    const savedBlog = await blog.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "Blog créé",
      blog: savedBlog,
    });
  } catch (error) {
    console.error("Erreur création blog :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

/**
 * Récupération de tous les articles — CÔTÉ PUBLIC.
 * ✅ CORRECTION : ne renvoie que les articles publiés.
 */
export async function getBlogs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const perPage = Math.max(parseInt(req.query.perPage) || 5, 1);

    const filter = {
      status: "published",
    };

    if (req.query.category && req.query.category !== "Tous") {
      filter.category = req.query.category;
    }

    if (req.query.excludeFeatured === "true") {
      filter.featured = { $ne: true };
    }

    if (req.query.search?.trim()) {
      const search = req.query.search.trim();

      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const total = await BlogModel.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / perPage), 1);

    const blogs = await BlogModel.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    return res.status(200).json({
      success: true,
      error: false,
      data: blogs,
      total,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error("Erreur récupération blogs :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

/**
 * ✅ AJOUT : liste complète pour l'admin (brouillons + publiés).
 */
export async function getBlogsAdmin(req, res) {
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
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const total = await BlogModel.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / perPage), 1);

    const blogs = await BlogModel.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    return res.status(200).json({
      success: true,
      error: false,
      data: blogs,
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

export async function getFeaturedBlog(req, res) {
  try {
    const blog = await BlogModel.findOne({
      featured: true,
      status: "published", // ✅ CORRECTION
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      error: false,
      blog: blog || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

export async function getCategories(req, res) {
  try {
    const categories = await BlogModel.distinct("category", {
      status: "published", // ✅ CORRECTION : catégories réellement visibles au public
    });

    categories.sort((a, b) => a.localeCompare(b, "fr"));

    return res.status(200).json({
      success: true,
      error: false,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

/**
 * Récupération d'un article — CÔTÉ PUBLIC.
 * ✅ CORRECTION : un brouillon n'est pas accessible par id direct.
 */
export async function getBlog(req, res) {
  try {
    const blog = await BlogModel.findOne({
      _id: req.params.id,
      status: "published",
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Le blog avec cet ID n'existe pas",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      blog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

/**
 * ✅ AJOUT : récupération d'un article pour l'admin, brouillon inclus.
 */
export async function getBlogAdmin(req, res) {
  try {
    const blog = await BlogModel.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Le blog avec cet ID n'existe pas",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      blog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

export async function updatedBlog(req, res) {
  try {
    const existingBlog = await BlogModel.findById(req.params.id);

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Le blog n'existe pas",
      });
    }

    const updateData = {};

    if (req.body.title !== undefined) {
      updateData.title = req.body.title.trim();
    }

    if (req.body.excerpt !== undefined) {
      updateData.excerpt = req.body.excerpt;
    }

    if (req.body.category !== undefined) {
      updateData.category = req.body.category.trim();
    }

    if (req.body.image !== undefined) {
      updateData.image = req.body.image;
    }

    // ✅ AJOUT
    if (req.body.status !== undefined) {
      if (["draft", "published"].includes(req.body.status)) {
        updateData.status = req.body.status;
      }
    }

    if (req.body.readTime !== undefined) {
      updateData.readTime =
        Number(req.body.readTime) > 0 ? Number(req.body.readTime) : 1;
    }

    if (req.body.date !== undefined) {
      updateData.date = req.body.date;
    }

    if (req.body.author !== undefined) {
      updateData.author = {
        name: req.body.author?.name?.trim() || "",
        role: req.body.author?.role?.trim() || "",
      };
    }

    if (req.body.body !== undefined) {
      updateData.body = req.body.body;
    }

    if (req.body.featured !== undefined) {
      updateData.featured = Boolean(req.body.featured);
    }

    if (updateData.featured === true) {
      await ensureSingleFeatured(req.params.id);
    }

    const updatedBlog = await BlogModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      error: false,
      message: "Blog mis à jour",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Erreur mise à jour blog :", error);

    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

export async function deleteBlog(req, res) {
  try {
    const blog = await BlogModel.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Blog introuvable",
      });
    }

    const urls = collectBlogImageUrls(blog);

    for (const url of urls) {
      try {
        await removeFromCloudinary(url);
      } catch (cloudinaryError) {
        console.error("Erreur suppression Cloudinary :", cloudinaryError);
      }
    }

    await BlogModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Blog supprimé",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}

export async function removeImageFromCloudinary(req, res) {
  try {
    const imgUrl = req.query.img;

    if (!imgUrl) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Aucune image fournie",
      });
    }

    const result = await removeFromCloudinary(imgUrl);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Image supprimée",
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Erreur serveur",
    });
  }
}