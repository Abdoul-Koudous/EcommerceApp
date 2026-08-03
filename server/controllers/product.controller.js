import ProductModel from "../models/product.model.js";
import productRAMModel from "../models/productRAMs.js";
import productSIZEModel from "../models/productSIZE.js";
import productWEIGHTModel from "../models/productWEIGHT.js";

import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto"; // ✅ à ajouter en haut du fichier avec les autres imports
import CategoryModel from "../models/category.model.js";
import { error } from "console";

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

// ✅ Helper réutilisé par toutes les fonctions d'upload : envoie le buffer en
// mémoire directement à Cloudinary via upload_stream, sans jamais écrire sur disque.


// ...

// ✅ Helper réutilisé par toutes les fonctions d'upload : envoie le buffer en
// mémoire directement à Cloudinary via upload_stream, avec un public_id UNIQUE
// à chaque appel (résout le bug où toutes les images atterrissaient sur le
// même public_id "file", causant un refus d'écrasement par Cloudinary).
const uploadFromBuffer = (fileBuffer, originalName = "", options = {}) => {
  return new Promise((resolve, reject) => {
    const baseName = originalName
      ? originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
      : "product";
    const uniqueId = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: uniqueId, // ✅ garantit un asset distinct à chaque upload
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export async function uploadImages(request, response) {
  try {
    const image = request.files;
    const imagesArr = []; // locale à la requête

    for (let i = 0; i < image?.length; i++) {
      const result = await uploadFromBuffer(image[i].buffer, image[i].originalname);
      imagesArr.push(result.secure_url);
    }

    return response.status(200).json({
      images: imagesArr,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function uploadBannerImages(request, response) {
  try {
    const image = request.files;
    const bannerImage = []; // locale à la requête

    for (let i = 0; i < image?.length; i++) {
      const result = await uploadFromBuffer(image[i].buffer, image[i].originalname);
      bannerImage.push(result.secure_url);
    }

    return response.status(200).json({
      images: bannerImage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
export async function createProduct(request, response) {
  try {
    let product = new ProductModel({
      name: request.body.name,
      description: request.body.description,
      images: request.body.images || [], // ✅ vient du payload envoyé par le front, plus de variable globale partagée
      bannerimages: request.body.bannerimages || [], // ✅ idem
      brand: request.body.brand,
      price: request.body.price,
      oldPrice: request.body.oldPrice,
      catName: request.body.catName,
      catId: request.body.catId,
      subCatId: request.body.subCatId,
      subCat: request.body.subCat,
      thirdsubCat: request.body.thirdsubCat,
      thirdSubCatId: request.body.thirdSubCatId,
      countIntStock: request.body.countIntStock,
      rating: request.body.rating,
      isFeatured: request.body.isFeatured,
      discount: request.body.discount,
      productRam: request.body.productRam,
      size: request.body.size,
      productWeight: request.body.productWeight,
      bannerTitleName: request.body.bannerTitleName || request.body.name,
      isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner || false,

      // ✅ OBLIGATOIRE pour éviter l'erreur
      category: request.body.category,
    });

    product = await product.save();

    return response.status(200).json({
      message: "Product créé avec succès",
      error: false,
      success: true,
      product,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getAllProducts(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage);
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "La page Introuvable",
        success: false,
        error: true,
      });
    }

    const product = await ProductModel.find()
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    const products = await ProductModel.find();

    if (!products) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getAllProductsByCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 20;

    // 1. Calculer le nombre total de produits de cette catégorie
    const totalPosts = await ProductModel.countDocuments({
      catId: request.params.id,
    });

    if (totalPosts === 0) {
      return response.status(404).json({
        message: "Aucun produit trouvé pour cette catégorie",
        success: false,
        error: true,
      });
    }

    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({
        message: "Page introuvable",
        success: false,
        error: true,
      });
    }

    // 2. Récupérer les produits filtrés
    const products = await ProductModel.find({
      catId: request.params.id,
    })
      .populate("category") // uniquement si category est ref: "Categorie"
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAllProductsByCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 20;

    const catName = request.query.catName;

    if (!catName) {
      return response.status(400).json({
        message: "catName est obligatoire dans la requête",
        success: false,
        error: true,
      });
    }

    // 1. Calculer le nombre de produits de cette catégorie
    const totalPosts = await ProductModel.countDocuments({ catName });

    if (totalPosts === 0) {
      return response.status(404).json({
        message: "Aucun produit trouvé pour cette catégorie",
        success: false,
        error: true,
      });
    }

    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page introuvable",
        success: false,
        error: true,
      });
    }

    // 2. Récupérer les produits filtrés par catName
    const products = await ProductModel.find({ catName })
      .populate("category") // si ref: "Categorie"
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      products,
      totalPages,
      page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAllProductsBySubCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 20;

    // 1. Calculer le nombre total de produits de cette catégorie
    const totalPosts = await ProductModel.countDocuments({
      subCatId: request.params.id,
    });

    if (totalPosts === 0) {
      return response.status(404).json({
        message: "Aucun produit trouvé pour cette catégorie",
        success: false,
        error: true,
      });
    }

    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({
        message: "Page introuvable",
        success: false,
        error: true,
      });
    }

    // 2. Récupérer les produits filtrés
    const products = await ProductModel.find({
      subCatId: request.params.id,
    })
      .populate("category") // uniquement si category est ref: "Categorie"
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAllProductsBySubCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 20;

    const subCat = request.query.subCat;

    if (!subCat) {
      return response.status(400).json({
        message: "catName est obligatoire dans la requête",
        success: false,
        error: true,
      });
    }

    // 1. Calculer le nombre de produits de cette catégorie
    const totalPosts = await ProductModel.countDocuments({ subCat });

    if (totalPosts === 0) {
      return response.status(404).json({
        message: "Aucun produit trouvé pour cette catégorie",
        success: false,
        error: true,
      });
    }

    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page introuvable",
        success: false,
        error: true,
      });
    }

    // 2. Récupérer les produits filtrés par catName
    const products = await ProductModel.find({ subCat })
      .populate("category") // si ref: "Categorie"
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      products,
      totalPages,
      page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAllProductsByThirdLavelCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 20;

    // 1. Calculer le nombre total de produits de cette catégorie
    const totalPosts = await ProductModel.countDocuments({
      thirdsubCatId: request.params.id,
    });

    if (totalPosts === 0) {
      return response.status(404).json({
        message: "Aucun produit trouvé pour cette catégorie",
        success: false,
        error: true,
      });
    }

    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({
        message: "Page introuvable",
        success: false,
        error: true,
      });
    }

    // 2. Récupérer les produits filtrés
    const products = await ProductModel.find({
      thirdsubCatId: request.params.id,
    })
      .populate("category") // uniquement si category est ref: "Categorie"
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAllProductsByThirdLavelCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 20;

    const thirdsubCat = request.query.thirdsubCat;

    if (!thirdsubCat) {
      return response.status(400).json({
        message: "catName est obligatoire dans la requête",
        success: false,
        error: true,
      });
    }

    // 1. Calculer le nombre de produits de cette catégorie
    const totalPosts = await ProductModel.countDocuments({ thirdsubCat });

    if (totalPosts === 0) {
      return response.status(404).json({
        message: "Aucun produit trouvé pour cette catégorie",
        success: false,
        error: true,
      });
    }

    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page introuvable",
        success: false,
        error: true,
      });
    }

    // 2. Récupérer les produits filtrés par catName
    const products = await ProductModel.find({ thirdsubCat })
      .populate("category") // si ref: "Categorie"
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      products,
      totalPages,
      page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAllProductsByPrice(request, response) {
  try {
    const { catId, subCatId, thirdsubCatId, minPrice, maxPrice } =
      request.query;

    // Construire dynamiquement le filtre Mongo
    let filter = {};

    if (catId) filter.catId = catId;
    if (subCatId) filter.subCatId = subCatId;
    if (thirdsubCatId) filter.thirdsubCatId = thirdsubCatId;

    // Récupérer les produits par catégorie
    const products = await ProductModel.find(filter).populate("category");

    // Filtrer par prix
    const filteredProducts = products.filter((product) => {
      if (minPrice && product.price < parseInt(minPrice)) return false;
      if (maxPrice && product.price > parseInt(maxPrice)) return false;
      return true;
    });

    return response.status(200).json({
      error: false,
      success: true,
      products: filteredProducts,
      totalPages: 0,
      page: 0,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}
export async function getAllProductsByRating(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 20;

    const { rating, catId, subCatId, thirdsubCatId } = request.query;

    if (!rating) {
      return response.status(400).json({
        message: "rating est obligatoire",
        success: false,
        error: true,
      });
    }

    // Construire le filtre
    let filter = { rating: parseFloat(rating) };

    if (catId) filter.catId = catId;
    if (subCatId) filter.subCatId = subCatId;
    if (thirdsubCatId) filter.thirdsubCatId = thirdsubCatId;

    // Compter les produits correspondants
    const totalPosts = await ProductModel.countDocuments(filter);

    if (totalPosts === 0) {
      return response.status(404).json({
        message: "Aucun produit trouvé",
        success: false,
        error: true,
      });
    }

    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({
        message: "Page introuvable",
        success: false,
        error: true,
      });
    }

    // Récupérer les produits
    const products = await ProductModel.find(filter)
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      products,
      totalPages,
      page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getProductsCount(request, response) {
  try {
    const productscount = await ProductModel.countDocuments();

    if (!productscount) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      productscount: productscount,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getAllFeaturedProducts(request, response) {
  try {
    const products = await ProductModel.find({ isFeatured: true }).populate(
      "category",
    );

    if (!products) {
      return response.status(500).json({
        error: true,
        success: false,
        message: "Erreur lors de la récupération des produits",
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      products,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function deleteProducts(request, response) {
  try {
    const product = await ProductModel.findById(request.params.id).populate(
      "category",
    );

    if (!product) {
      return response.status(404).json({
        message: "Produit introuvable",
        error: true,
        success: false,
      });
    }

    const images = product.images || [];

    for (const img of product.images) {
      try {
        const parts = img.split("/");
        const file = parts[parts.length - 1];
        const publicId = file.split(".")[0];

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("Image non supprimée :", img);
      }
    }

    const deleteProduct = await ProductModel.findByIdAndDelete(
      request.params.id,
    );

    if (!deleteProduct) {
      return response.status(400).json({
        message: "Produit non supprimé",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Produit supprimé supprimés avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression produit :", error);
    return response.status(500).json({
      success: false,
      error: true,
      message: "Erreur serveur lors de la suppression",
    });
  }
}
export async function deleteMultipleProduct(req, res) {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: "Aucun ID de produit fourni",
      error: true,
      success: false,
    });
  }

  try {
    const products = await ProductModel.find({ _id: { $in: ids } });

    for (const product of products) {
      if (Array.isArray(product.images)) {
        for (const imgUrl of product.images) {
          try {
            const parts = imgUrl.split("/");
            const file = parts[parts.length - 1];
            const publicId = file.split(".")[0];

            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn("Image non supprimée :", imgUrl);
          }
        }
      }
    }

    await ProductModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: "Produits supprimés avec succès",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("DELETE MULTIPLE ERROR:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: true,
      success: false,
    });
  }
}

export async function getProduct(request, response) {
  try {
    const product = await ProductModel.findById(request.params.id).populate(
      "category",
    );

    if (!product) {
      return response.status(404).json({
        message: "le produit est introuvable",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      product: product,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function removeImageFromCloudinary(req, res) {
  try {
    const imgUrl = req.query.img;
    if (!imgUrl) {
      return res
        .status(400)
        .json({ error: true, message: "Aucune image fournie" });
    }

    const imageName = imgUrl.split("/").pop().split(".")[0];
    if (!imageName) {
      return res
        .status(400)
        .json({ error: true, message: "Nom d'image invalide" });
    }

    const result = await cloudinary.uploader.destroy(imageName);

    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
}

export async function updateProduct(request, response) {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
        description: request.body.description,
        images: request.body.images,
        bannerimages: request.body.bannerimages, // ✅ corrigé : le front envoie "bannerimages" (minuscule), pas "bannerImage"
        bannerTitleName: request.body.bannerTitleName,
        isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
        brand: request.body.brand,
        price: request.body.price,
        oldPrice: request.body.oldPrice,
        catName: request.body.catName,
        catId: request.body.catId,
        subCatId: request.body.subCatId,
        subCat: request.body.subCat,
        thirdsubCat: request.body.thirdsubCat,
        thirdSubCatId: request.body.thirdSubCatId ?? undefined,
        countIntStock: request.body.countIntStock,
        rating: request.body.rating,
        isFeatured: request.body.isFeatured,
        discount: request.body.discount,
        productRam: request.body.productRam,
        size: request.body.size,
        productWeight: request.body.productWeight,

        // IMPORTANT : category doit être l'ID
        category: request.body.category,
      },
      { new: true },
    );

    if (!product) {
      return response.status(404).json({
        message: "Le produit n'a pas été mis à jour",
        success: false,
      });
    }

    return response.status(200).json({
      message: "Le produit a été mis à jour avec succès",
      error: false,
      success: true,
      product,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getProducts(req, res) {
  try {
    const {
      catName,
      subCat,
      thirdsubCat,
      search,
      page = 1,
      perPage = 10,
    } = req.query;

    const filter = {};

    // 🎯 filtres totalement indépendants
    if (catName) filter.catName = catName;
    if (subCat) filter.subCat = subCat;
    if (thirdsubCat) filter.thirdsubCat = thirdsubCat;

    // 🔍 recherche texte
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await ProductModel.countDocuments(filter);

    const products = await ProductModel.find(filter)
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(Number(perPage))
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      error: false,
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

export async function createProductRAM(request, response) {
  try {
    let productRAM = new productRAMModel({
      name: request.body.name,
    });
    productRAM = await productRAM.save();

    if (!productRAM) {
      return response.status(400).json({
        message: "Product RAM non créé",
        success: false,
        error: true,
      });
    }
    return response.status(200).json({
      message: "Product RAM créé avec succès",
      error: false,
      success: true,
      productRAM,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductRAM(request, response) {
  try {
    const productRAM = await productRAMModel.findById(request.params.id);

    if (!productRAM) {
      return response.status(404).json({
        message: "RAM introuvable",
        error: true,
        success: false,
      });
    }

    const deleteProduct = await productRAMModel.findByIdAndDelete(
      request.params.id,
    );

    if (!deleteProduct) {
      return response.status(400).json({
        message: "LA RAM du Produit non supprimé",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "La RAM du Produit supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression  RAM produit :", error);
    return response.status(500).json({
      success: false,
      error: true,
      message: "Erreur serveur lors de la suppression",
    });
  }
}
export async function deleteMultipleProductRAM(req, res) {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: "Aucun ID de produit fourni",
      error: true,
      success: false,
    });
  }

  try {
    await productRAMModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: "La RAM du Produits supprimés avec succès",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("DELETE MULTIPLE ERROR:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: true,
      success: false,
    });
  }
}

export async function updateProductRAM(request, response) {
  try {
    const productRAM = await productRAMModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true },
    );
    if (!productRAM) {
      return response.status(404).json({
        message: "La RAM du produit n'a pas été mis à jour",
        success: false,
      });
    }
    return response.status(200).json({
      message: "La RAM du produit a été mis à jour avec succès",
      error: false,
      success: true,
      productRAM,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}
export async function getAllProductRAMs(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 5;

    const skip = (page - 1) * perPage;

    const total = await productRAMModel.countDocuments();

    const productRAMs = await productRAMModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      productRAMs,
      total,
      page,
      perPage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getProductRAMById(request, response) {
  try {
    const productRAM = await productRAMModel.findById(request.params.id);
    if (!productRAM) {
      return response.status(404).json({
        message: "la RAM du produit est introuvable",
        error: true,
        success: false,
      });
    }
    return response.status(200).json({
      error: false,
      success: true,
      productRAM: productRAM,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function createProductWEIGHT(request, response) {
  try {
    let productWEIGHT = new productWEIGHTModel({
      name: request.body.name,
    });
    productWEIGHT = await productWEIGHT.save();

    if (!productWEIGHT) {
      return response.status(400).json({
        message: "Product WEIGHT non créé",
        success: false,
        error: true,
      });
    }
    return response.status(200).json({
      message: "Product WEIGHT créé avec succès",
      error: false,
      success: true,
      productWEIGHT,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductWEIGHT(request, response) {
  try {
    const productWEIGHT = await productWEIGHTModel.findById(request.params.id);

    if (!productWEIGHT) {
      return response.status(404).json({
        message: "WEIGHT introuvable",
        error: true,
        success: false,
      });
    }

    const deleteProduct = await productWEIGHTModel.findByIdAndDelete(
      request.params.id,
    );

    if (!deleteProduct) {
      return response.status(400).json({
        message: "LE WEIGHT du Produit non supprimé",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Le WEIGHT du Produit supprimé avec succèss",
    });
  } catch (error) {
    console.error("❌ Erreur suppression  WEIGHT produit :", error);
    return response.status(500).json({
      success: false,
      error: true,
      message: "Erreur serveur lors de la suppression",
    });
  }
}
export async function deleteMultipleProductWEIGHT(req, res) {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: "Aucun ID de produit fourni",
      error: true,
      success: false,
    });
  }

  try {
    await productWEIGHTModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: "Le WEIGHT du Produits supprimés avec succès",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("DELETE MULTIPLE ERROR:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: true,
      success: false,
    });
  }
}

export async function updateProductWEIGHT(request, response) {
  try {
    const productWEIGHT = await productWEIGHTModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true },
    );
    if (!productWEIGHT) {
      return response.status(404).json({
        message: "Le WEIGHT du produit n'a pas été mis à jour",
        success: false,
      });
    }
    return response.status(200).json({
      message: "Le WEIGHT du produit a été mis à jour avec succès",
      error: false,
      success: true,
      productWEIGHT,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}
export async function getAllProductWEIGHTs(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 5;

    const skip = (page - 1) * perPage;

    const total = await productWEIGHTModel.countDocuments();

    const productWEIGHTs = await productWEIGHTModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      productWEIGHTs,
      total,
      page,
      perPage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getProductWEIGHTById(request, response) {
  try {
    const productWEIGHT = await productWEIGHTModel.findById(request.params.id);
    if (!productWEIGHT) {
      return response.status(404).json({
        message: "le WEIGHT du produit est introuvable",
        error: true,
        success: false,
      });
    }
    return response.status(200).json({
      error: false,
      success: true,
      productWEIGHT: productWEIGHT,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function createProductSIZE(request, response) {
  try {
    let productSIZE = new productSIZEModel({
      name: request.body.name,
    });
    productSIZE = await productSIZE.save();

    if (!productSIZE) {
      return response.status(400).json({
        message: "Product SIZE non créé",
        success: false,
        error: true,
      });
    }
    return response.status(200).json({
      message: "Product SIZE créé avec succès",
      error: false,
      success: true,
      productSIZE,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductSIZE(request, response) {
  try {
    const productSIZE = await productSIZEModel.findById(request.params.id);

    if (!productSIZE) {
      return response.status(404).json({
        message: "SIZE introuvable",
        error: true,
        success: false,
      });
    }

    const deleteProduct = await productSIZEModel.findByIdAndDelete(
      request.params.id,
    );

    if (!deleteProduct) {
      return response.status(400).json({
        message: "LE SIZE du Produit non supprimé",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Le SIZE du Produit supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression  SIZE produit :", error);
    return response.status(500).json({
      success: false,
      error: true,
      message: "Erreur serveur lors de la suppression",
    });
  }
}
export async function deleteMultipleProductSIZE(req, res) {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: "Aucun ID de produit fourni",
      error: true,
      success: false,
    });
  }

  try {
    await productSIZEModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: "Le SIZE du Produits supprimés avec succès",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("DELETE MULTIPLE ERROR:", error);
    return res.status(500).json({
      message: "Erreur serveur",
      error: true,
      success: false,
    });
  }
}

export async function updateProductSIZE(request, response) {
  try {
    const productSIZE = await productSIZEModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true },
    );
    if (!productSIZE) {
      return response.status(404).json({
        message: "Le SIZE du produit n'a pas été mis à jour",
        success: false,
      });
    }
    return response.status(200).json({
      message: "Le SIZE du produit a été mis à jour avec succès",
      error: false,
      success: true,
      productSIZE,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}
export async function getAllProductSIZEs(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 5;

    const skip = (page - 1) * perPage;

    const total = await productSIZEModel.countDocuments();

    const productSIZEs = await productSIZEModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    return response.status(200).json({
      error: false,
      success: true,
      productSIZEs,
      total,
      page,
      perPage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function getProductSIZEById(request, response) {
  try {
    const productSIZE = await productSIZEModel.findById(request.params.id);
    if (!productSIZE) {
      return response.status(404).json({
        message: "le SIZE du produit est introuvable",
        error: true,
        success: false,
      });
    }
    return response.status(200).json({
      error: false,
      success: true,
      productSIZE: productSIZE,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function filters(request, response) {
  const {
    catId = [],
    subCatId = [],
    thirdsubCatId = [],
    minPrice = 0,
    maxPrice = 999999999,
    rating,
    search,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 15,
  } = request.body || {};

  const filter = {};

  if (catId?.length) filter.catId = { $in: catId };
  if (subCatId?.length) filter.subCatId = { $in: subCatId };
  if (thirdsubCatId?.length) filter.thirdsubCatId = { $in: thirdsubCatId };
  if (minPrice !== undefined && maxPrice !== undefined) {
    filter.price = {
      $gte: Number(minPrice) || 0,
      $lte: Number(maxPrice) || 999999999,
    };
  }
  if (search && search.trim()) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { catName: { $regex: search, $options: "i" } },
      { subCat: { $regex: search, $options: "i" } },
      { thirdsubCat: { $regex: search, $options: "i" } },
    ];
  }

  // ✅ Filtre utilisé pour la LISTE de produits : inclut la note si sélectionnée
  const filterForProducts = { ...filter };
  if (rating && !isNaN(Number(rating))) {
    filterForProducts.rating = Number(rating);
  }

  let sort = {};
  switch (sortBy) {
    case "name":
      sort.name = order === "asc" ? 1 : -1;
      break;
    case "price":
      sort.price = order === "asc" ? 1 : -1;
      break;
    case "createdAt":
    default:
      sort.createdAt = order === "asc" ? 1 : -1;
      break;
  }

  try {
    const products = await ProductModel.find(filterForProducts)
      .populate("category")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ProductModel.countDocuments(filterForProducts);

    // ✅ Comptage par étoile : basé sur `filter` (SANS le rating) pour que
    // toutes les options 1-5 étoiles restent affichées avec leur vrai total,
    // même quand une note est déjà sélectionnée.
    const ratingAgg = await ProductModel.aggregate([
      { $match: filter },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingAgg.forEach((r) => {
      const star = Math.round(r._id);
      if (ratingCounts[star] !== undefined) {
        ratingCounts[star] += r.count;
      }
    });

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      ratingCounts: ratingCounts,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}

export async function sortBy(req, res) {
  try {
    const {
      sortBy = "createdAt",
      order = "desc",
      catId = [],
      subCatId = [],
      thirdsubCatId = [],
      search,
      page = 1,
      limit = 10,
    } = req.body;

    let sort = {};
    switch (sortBy) {
      case "name":
        sort.name = order === "asc" ? 1 : -1;
        break;
      case "price":
        sort.price = order === "asc" ? 1 : -1;
        break;
      case "createdAt":
      default:
        sort.createdAt = order === "asc" ? 1 : -1;
        break;
    }

    const filter = {};
    if (catId?.length) filter.catId = { $in: catId };
    if (subCatId?.length) filter.subCatId = { $in: subCatId };
    if (thirdsubCatId?.length) filter.thirdsubCatId = { $in: thirdsubCatId };
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { catName: { $regex: search, $options: "i" } },
        { subCat: { $regex: search, $options: "i" } },
        { thirdsubCat: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await ProductModel.find(filter)
      .populate("category")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await ProductModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


export async function searchProductController(request, response){
  try {
    const query = request.query.q;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 20;

    if(!query){
      return response.status(400).json({
        error: true,
        success: false,
        message: "La requête est requise"
      });
    }

    const filter = {
      $or:[
        {name: {$regex: query, $options: "i"}},
        {brand: {$regex: query, $options: "i"}},
        {catName: {$regex: query, $options: "i"}},
        {subCat: {$regex: query, $options: "i"}},
        {thirdsubCat: {$regex: query, $options: "i"}},
      ],
    };

    const total = await ProductModel.countDocuments(filter);

    const products = await ProductModel.find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return response.status(200).json({
      error: false,
      success: true,
      products: products,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    })
    
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    })
  }
}

export async function searchSuggestions(request, response) {
  try {
    const query = request.query.q;

    if (!query || !query.trim()) {
      return response.status(200).json({
        error: false,
        success: true,
        products: [],
      });
    }

    const filter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { catName: { $regex: query, $options: "i" } },
        { subCat: { $regex: query, $options: "i" } },
        { thirdsubCat: { $regex: query, $options: "i" } },
      ],
    };

    const products = await ProductModel.find(filter)
      .select("name price oldPrice images")
      .sort({ createdAt: -1 })
      .limit(6);

    return response.status(200).json({
      error: false,
      success: true,
      products,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// N'oublie pas d'ajouter la route dans ton fichier de routes produit, juste à côté
// de ta route /search existante, par exemple :
//
// router.get("/api/product/searchSuggestions", searchSuggestions);