import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "./addproduct.scss";
import { UserContext } from "../../UserContext/UserContext";
import { editData, fetchDataFromApi, uploadImages } from "../utils/api";
import HoverRating from "../../components/HoverRating/HoverRating";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

// Dropdown multi-sélection
const DropdownMultiSelect = ({ label, options, selectedValues, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const toggleSelection = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="apd-multi-select" ref={containerRef}>
      <label>{label}</label>
      <div className="apd-selected-values" onClick={() => setOpen(!open)}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
          }}
        >
          {selectedValues && selectedValues.length > 0 ? (
            selectedValues.map((val) => (
              <span key={val} className="apd-tag">
                {val}
              </span>
            ))
          ) : (
            <span>Sélectionne...</span>
          )}
        </div>
        <span className="icon">
          {open ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </div>

      {open && (
        <div className="apd-options">
          {options.map((opt) => (
            <div
              key={opt}
              className={`apd-option ${selectedValues.includes(opt) ? "selected" : ""}`}
              onClick={() => toggleSelection(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EditProduct = ({ product, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const { categories } = useContext(UserContext);

  const { openToast } = useContext(ToastContext);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingMainImage, setLoadingMainImage] = useState(false);
  const [loadingExtraImages, setLoadingExtraImages] = useState(false);

  const descriptionRef = useRef(null); // ✅ ref pour l'auto-resize du textarea description

  // STATES
  const [mainImageFile, setMainImageFile] = useState(null);
  const [extraImageFiles, setExtraImageFiles] = useState([]); // nouveaux File
  const [extraImagePreviews, setExtraImagePreviews] = useState([]); // blob URLs pour preview
  const [existingExtraImages, setExistingExtraImages] = useState([]); // URLs Cloudinary existantes

  // STATES : options (API) vs selections (utilisateur)
  const [ramOptions, setRamOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [weightOptions, setWeightOptions] = useState([]);

  const [bannerFiles, setBannerFiles] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);
  const [existingBannerImages, setExistingBannerImages] = useState([]);
  const [loadingBanner, setLoadingBanner] = useState(false);

  const [productRam, setProductRam] = useState([]);
  const [productSize, setProductSize] = useState([]);
  const [productWeight, setProductWeight] = useState([]);

  const [selectedThirdSubCat, setSelectedThirdSubCat] = useState("");

  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");

  const [formFields, setFormFields] = useState({
    name: "",
    description: "",
    mainImage: null,
    extraImages: [],
    brand: "",
    price: 0,
    oldPrice: 0,
    catName: "",
    catId: "",
    subCat: "",
    thirdsubCat: "",
    subCatId: "",
    thirdSubCatId: "",
    countIntStock: 0,
    rating: 0,
    isFeatured: false,
    discount: 0,
    productRam: [],
    size: [],
    productWeight: [],
    bannerTitleName: "",
    bannerimages: [],
    isDisplayOnHomeBanner: false,

    // ✅ NOUVEAU : taxe / livraison
    hasShipping: true,
    shippingFee: "",
    hasTax: true,
    taxRate: "",
  });

  useEffect(() => {
    if (!product) return;

    setFormFields({
      name: product.name || "",
      description: product.description || "",
      brand: product.brand || "",
      price: product.price || 0,
      oldPrice: product.oldPrice || 0,
      discount: product.discount || 0,
      countIntStock: product.countIntStock || 0,
      rating: product.rating || 0,
      isFeatured: product.isFeatured ?? false,
      catId: product.catId || "",
      catName: product.catName || "",
      subCatId: product.subCatId || "",
      subCat: product.subCat || "",
      thirdSubCatId: product.thirdSubCatId || "",
      thirdsubCat: product.thirdsubCat || "",
      productRam: product.productRam || [],
      size: product.size || [],
      productWeight: product.productWeight || [],
      mainImage: product.images?.[0] || null,
      extraImages: [], // vide, les existantes vont dans existingExtraImages
      bannerTitleName: product.bannerTitleName || "",
      isDisplayOnHomeBanner: product.isDisplayOnHomeBanner ?? false,

      // ✅ NOUVEAU
      hasShipping: product.hasShipping ?? true,
      shippingFee: product.shippingFee ?? "",
      hasTax: product.hasTax ?? true,
      taxRate: product.taxRate ?? "",
    });

    setExistingExtraImages(product.images?.slice(1) || []);
    setExistingBannerImages(product.bannerimages || []);
    setSelectedCat(product.catId || "");
    setSelectedSubCat(product.subCatId || "");
    setSelectedThirdSubCat(product.thirdSubCatId || "");

    // Initialiser les selections dropdown
    setProductRam(product.productRam || []);
    setProductSize(product.size || []);
    setProductWeight(product.productWeight || []);
  }, [product]);

  useEffect(() => {
    // RAM
    fetchDataFromApi("/api/product/productRAM").then((res) => {
      if (res?.error === false) {
        setRamOptions(res.productRAMs?.map((item) => item.name) || []);
      }
    });

    // SIZE
    fetchDataFromApi("/api/product/productSIZE").then((res) => {
      if (res?.error === false) {
        setSizeOptions(res.productSIZEs?.map((item) => item.name) || []);
      }
    });

    // WEIGHT
    fetchDataFromApi("/api/product/productWEIGHT").then((res) => {
      if (res?.error === false) {
        setWeightOptions(res.productWEIGHTs?.map((item) => item.name) || []);
      }
    });
  }, []);

  const mainCategories = categories || [];

  const subCategories = useMemo(() => {
    return mainCategories.find((c) => c._id === selectedCat)?.children || [];
  }, [mainCategories, selectedCat]);

  const thirdSubCategories = useMemo(() => {
    return (
      subCategories.find((sc) => sc._id === selectedSubCat)?.children || []
    );
  }, [subCategories, selectedSubCat]);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  // Changer les images (prévisualisation)
  const handleImageChange = async (e, main = false) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      if (main) setLoadingMainImage(true);
      else setLoadingExtraImages(true);

      if (main) {
        const file = files[0];
        setMainImageFile(file);
        setFormFields((prev) => ({
          ...prev,
          mainImage: URL.createObjectURL(file),
        }));
      } else {
        const previews = files.map((f) => URL.createObjectURL(f));
        setExtraImageFiles((prev) => [...prev, ...files]);
        setExtraImagePreviews((prev) => [...prev, ...previews]);
        // NE PAS toucher formFields.extraImages ici
      }
    } finally {
      if (main) setLoadingMainImage(false);
      else setLoadingExtraImages(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      extraImagePreviews.forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBannerChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const previews = files.map((f) => URL.createObjectURL(f));

    setBannerFiles((prev) => [...prev, ...files]);
    setBannerPreviews((prev) => [...prev, ...previews]);
  };

  const removeExistingBanner = (index) => {
    setExistingBannerImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewBanner = (index) => {
    setBannerFiles((prev) => prev.filter((_, i) => i !== index));
    setBannerPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Supprimer une image secondaire
  const removeExistingImage = (index) => {
    setExistingExtraImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(extraImagePreviews[index]);
    setExtraImageFiles((prev) => prev.filter((_, i) => i !== index));
    setExtraImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 VALIDATION
    if (!formFields.name.trim())
      return openToast("error", "Le nom du produit est obligatoire");
    if (!formFields.description.trim())
      return openToast("error", "La description du produit est obligatoire");

    if (!formFields.catId)
      return openToast("error", "Veuillez sélectionner une catégorie");

    if (!formFields.mainImage && !mainImageFile)
      return openToast("error", "Veuillez ajouter une image principale");

    // ✅ retiré : l'exigence d'une image secondaire (un produit avec une seule photo est valide)
    if (formFields.countIntStock < 0)
      return openToast("error", "Le stock ne peut pas être négatif");
    // ✅ assoupli : "< 0" au lieu de "<= 0" — un stock à 0 (rupture / précommande) est valide
    if (formFields.discount < 0)
      return openToast("error", "La remise ne peut pas être négative");
    if (formFields.price < 0)
      return openToast("error", "Le prix ne peut pas être négatif");
    if (formFields.oldPrice < 0)
      return openToast("error", "L'ancien prix ne peut pas être négatif");
    if (formFields.rating < 0 || formFields.rating > 5)
      return openToast("error", "La note doit être comprise entre 0 et 5");
    if (formFields.discount > 100)
      return openToast("error", "La remise ne peut pas dépasser 100%");
    if (formFields.oldPrice > 0 && formFields.oldPrice < formFields.price)
      return openToast(
        "error",
        "L'ancien prix doit être supérieur au prix actuel",
      );
    if (!Number.isInteger(Number(formFields.countIntStock)))
      return openToast("error", "Le stock doit être un nombre entier");
    if (
      formFields.hasShipping &&
      formFields.shippingFee !== "" &&
      Number(formFields.shippingFee) < 0
    )
      return openToast("error", "Les frais de livraison ne peuvent pas être négatifs");
    if (
      formFields.hasTax &&
      formFields.taxRate !== "" &&
      (Number(formFields.taxRate) < 0 || Number(formFields.taxRate) > 1)
    )
      return openToast("error", "Le taux de taxe doit être compris entre 0 et 1");

    // 🔹 SUBMIT

    try {
      setLoadingSubmit(true);
      let finalImages = [];

      // 1. Image principale
      if (mainImageFile) {
        const fd = new FormData();
        fd.append("images", mainImageFile);
        const uploadRes = await uploadImages("/api/product/uploadImages", fd);
        finalImages.push(uploadRes.images[0]);
      } else {
        finalImages.push(formFields.mainImage);
      }

      // 2. Images existantes (deja sur Cloudinary)
      finalImages.push(...existingExtraImages);

      // 3. Nouvelles images (a uploader)
      if (extraImageFiles.length > 0) {
        const fd = new FormData();
        extraImageFiles.forEach((f) => fd.append("images", f));
        const uploadRes = await uploadImages("/api/product/uploadImages", fd);
        finalImages.push(...uploadRes.images);
      }
      let bannerUrls = [...existingBannerImages];

      if (bannerFiles.length > 0) {
        const fd = new FormData();
        bannerFiles.forEach((f) => fd.append("bannerimages", f));

        const res = await uploadImages("/api/product/uploadBannerImages", fd);

        if (!res || res.error) throw new Error("Erreur upload banner");

        bannerUrls.push(...res.images);
      }

      // Aucune blob URL dans finalImages
      const { extraImages, mainImage, ...cleanFields } = formFields;
      const payload = {
        ...cleanFields,
        shippingFee:
          formFields.shippingFee === "" ? null : Number(formFields.shippingFee),
        taxRate: formFields.taxRate === "" ? null : Number(formFields.taxRate),
        images: finalImages,
        bannerimages: bannerUrls,
        bannerTitleName: formFields.bannerTitleName?.trim() || formFields.name,
      };
      const res = await editData(
        `/api/product/updateProduct/${product._id}`,
        payload,
      );

      if (!res?.success) throw new Error(res?.message || "Erreur");
      openToast("success", res?.message || "Produit mis a jour");
      setTimeout(handleClose, 500);
    } catch (error) {
      openToast("error", error.message || "Erreur serveur");
    } finally {
      setLoadingSubmit(false);
    }
  };

  useEffect(() => {
    if (
      selectedThirdSubCat &&
      !thirdSubCategories.find((t) => t._id === selectedThirdSubCat)
    ) {
      setSelectedThirdSubCat("");
      setFormFields((prev) => ({
        ...prev,
        thirdSubCatId: "",
        thirdsubCat: "",
      }));
    }
  }, [thirdSubCategories, selectedThirdSubCat]);

  useEffect(() => {
    const price = Number(formFields.price);
    const oldPrice = Number(formFields.oldPrice);

    if (oldPrice > 0 && price >= 0 && oldPrice >= price) {
      const discount = Math.round(((oldPrice - price) / oldPrice) * 100);

      setFormFields((prev) => ({
        ...prev,
        discount: discount,
      }));
    }
  }, [formFields.price, formFields.oldPrice]);

  // ✅ auto-resize du textarea description à chaque changement de contenu (saisie ou chargement produit)
  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResizeTextarea(descriptionRef.current);
  }, [formFields.description]);

  return (
    <div className="apd-overlay">
      <div className={`apd-content ${isClosing ? "closing" : "opening"}`}>
        <div className="apd-header">
          <div className="apd-header-left">
            <button className="apd-close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Modifier le produit</h2>
          </div>
        </div>

        <div className="apd-body">
          <form onSubmit={handleSubmit} className="apd-form">
            <div className="apd-form-group">
              <label>Nom du produit</label>
              <input
                type="text"
                name="name"
                value={formFields.name}
                onChange={onChangeInput}
              />
            </div>
            <div className="apd-form-group">
              <label>Description</label>
              <textarea
                ref={descriptionRef}
                name="description"
                value={formFields.description}
                onChange={onChangeInput}
              />
            </div>

            {/* Catégories */}
            <div className="apd-row">
              <div className="apd-form-group">
                <label>Catégorie</label>
                <select
                  value={selectedCat}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selected =
                      mainCategories.find((c) => c._id === value)?.name || "";

                    setSelectedCat(value);
                    setSelectedSubCat("");
                    setSelectedThirdSubCat(""); // ✅ ICI

                    setFormFields((prev) => ({
                      ...prev,
                      catId: value,
                      catName: selected,
                      subCatId: "",
                      subCat: "",
                      thirdSubCatId: "",
                      thirdsubCat: "",
                    }));
                  }}
                >
                  <option value="">Sélectionne...</option>
                  {mainCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="apd-form-group">
                <label>Sous-catégorie</label>
                <select
                  name="subCatId"
                  value={selectedSubCat}
                  disabled={!selectedCat}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selected =
                      subCategories.find((sc) => sc._id === value)?.name || "";

                    setSelectedSubCat(value);
                    setSelectedThirdSubCat(""); // ✅ ICI

                    setFormFields((prev) => ({
                      ...prev,
                      subCatId: value,
                      subCat: selected,
                      thirdSubCatId: "",
                      thirdsubCat: "",
                    }));
                  }}
                >
                  <option value="">Sélectionne...</option>
                  {subCategories.map((sc) => (
                    <option key={sc._id} value={sc._id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="apd-form-group">
                <label>Sous-sous-catégorie</label>
                <select
                  name="thirdSubCatId"
                  disabled={!selectedSubCat}
                  value={formFields.thirdSubCatId}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selectedName =
                      thirdSubCategories.find((t) => t._id === value)?.name ||
                      "";

                    setFormFields((prev) => ({
                      ...prev,
                      thirdSubCatId: value,
                      thirdsubCat: selectedName,
                    }));
                  }}
                >
                  <option value="">Sélectionne...</option>
                  {thirdSubCategories.map((tsc) => (
                    <option key={tsc._id} value={tsc._id}>
                      {tsc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prix */}
            <div className="apd-row">
              <div className="apd-form-group">
                <label>Prix</label>
                <input
                  type="number"
                  name="price"
                  value={formFields.price}
                  onChange={onChangeInput}
                />
              </div>

              <div className="apd-form-group">
                <label>Ancien prix</label>
                <input
                  type="number"
                  name="oldPrice"
                  value={formFields.oldPrice}
                  onChange={onChangeInput}
                />
              </div>

              <div className="apd-form-group">
                <label>Note</label>
                <HoverRating
                  rating={formFields.rating}
                  onChange={(val) =>
                    setFormFields((prev) => ({ ...prev, rating: val }))
                  }
                />
              </div>
            </div>

            {/* Infos */}
            <div className="apd-row">
              <div className="apd-form-group">
                <label>Produit en vedette ?</label>
                <select
                  value={String(formFields.isFeatured)}
                  onChange={(e) =>
                    setFormFields((prev) => ({
                      ...prev,
                      isFeatured: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>

              <div className="apd-form-group">
                <label> En Stock</label>
                <input
                  type="number"
                  name="countIntStock"
                  value={formFields.countIntStock}
                  onChange={onChangeInput}
                />
              </div>

              <div className="apd-form-group">
                <label>Marque</label>
                <input
                  type="text"
                  name="brand"
                  value={formFields.brand}
                  onChange={onChangeInput}
                />
              </div>

              <div className="apd-form-group">
                <label>Remise (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formFields.discount}
                  readOnly
                />
              </div>
            </div>

            {/* Taxe & Livraison */}
            <div className="apd-row">
              <div className="apd-form-group apd-banner-toggle">
                <label>Ce produit a des frais de livraison</label>
                <div
                  className={`apd-switch ${formFields.hasShipping ? "active" : ""}`}
                  onClick={() =>
                    setFormFields((prev) => ({
                      ...prev,
                      hasShipping: !prev.hasShipping,
                    }))
                  }
                >
                  <div className="apd-slider"></div>
                </div>
              </div>

              {formFields.hasShipping && (
                <div className="apd-form-group">
                  <label>Frais de livraison (optionnel)</label>
                  <input
                    type="number"
                    name="shippingFee"
                    placeholder="Laisser vide = utilise la config par défaut"
                    value={formFields.shippingFee}
                    onChange={onChangeInput}
                  />
                </div>
              )}
            </div>

            <div className="apd-row">
              <div className="apd-form-group apd-banner-toggle">
                <label>Ce produit est taxable</label>
                <div
                  className={`apd-switch ${formFields.hasTax ? "active" : ""}`}
                  onClick={() =>
                    setFormFields((prev) => ({
                      ...prev,
                      hasTax: !prev.hasTax,
                    }))
                  }
                >
                  <div className="apd-slider"></div>
                </div>
              </div>

              {formFields.hasTax && (
                <div className="apd-form-group">
                  <label>Taux de taxe (optionnel)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    name="taxRate"
                    placeholder="Ex: 0.18 — vide = utilise la catégorie/défaut"
                    value={formFields.taxRate}
                    onChange={onChangeInput}
                  />
                </div>
              )}
            </div>

            {/* Multi-selections + Rating */}
            <div className="apd-row">
              <div className="apd-form-group">
                <DropdownMultiSelect
                  label="La RAM"
                  options={ramOptions}
                  selectedValues={productRam}
                  onChange={(vals) => {
                    setProductRam(vals);
                    setFormFields((prev) => ({ ...prev, productRam: vals }));
                  }}
                />
              </div>

              <div className="apd-form-group">
                <DropdownMultiSelect
                  label="Taille"
                  options={sizeOptions}
                  selectedValues={productSize}
                  onChange={(vals) => {
                    setProductSize(vals);
                    setFormFields((prev) => ({ ...prev, size: vals }));
                  }}
                />
              </div>

              <div className="apd-form-group">
                <DropdownMultiSelect
                  label="Poids"
                  options={weightOptions}
                  selectedValues={productWeight}
                  onChange={(vals) => {
                    setProductWeight(vals);
                    setFormFields((prev) => ({ ...prev, productWeight: vals }));
                  }}
                />
              </div>
            </div>

            {/* Images */}
            {/* Image principale */}
            <div className="apd-image-upload">
              <label>Image principale</label>
              <div
                className="apd-image-box"
                onClick={() => document.getElementById("main-img").click()}
              >
                {loadingMainImage ? (
                  <CircularProgress />
                ) : formFields.mainImage ? (
                  <img src={formFields.mainImage} alt="" />
                ) : (
                  <FaPlus />
                )}
              </div>
              <input
                id="main-img"
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleImageChange(e, true)}
              />
            </div>

            {/* Images secondaires */}
            <div className="apd-image-upload">
              <label>Images secondaires</label>
              <div className="apd-extra-images">
                {/* Existantes (Cloudinary) */}
                {existingExtraImages.map((img, i) => (
                  <div key={`existing-${i}`} className="apd-image-preview">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`existante ${i}`}
                    />
                    <button onClick={() => removeExistingImage(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}

                {/* Nouvelles (blob previews) */}
                {extraImagePreviews.map((img, i) => (
                  <div key={`new-${i}`} className="apd-image-preview">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`nouvelle ${i}`}
                    />
                    <button onClick={() => removeNewImage(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}

                <div
                  className="apd-image-box"
                  onClick={() => document.getElementById("extra-img").click()}
                >
                  {loadingExtraImages ? (
                    <CircularProgress size={30} />
                  ) : (
                    <>
                      <FaCloudUploadAlt />
                      <span>Ajouter des images</span>
                    </>
                  )}
                </div>
                <input
                  id="extra-img"
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, false)}
                />
              </div>
            </div>

            <div className="apd-image-upload">
              <label>Images Banner</label>

              <div className="apd-extra-images">
                {/* EXISTANTES */}
                {existingBannerImages.map((img, i) => (
                  <div key={i} className="apd-image-preview">
                    <img src={img} alt="" />
                    <button onClick={() => removeExistingBanner(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}

                {/* NOUVELLES */}
                {bannerPreviews.map((img, i) => (
                  <div key={i} className="apd-image-preview">
                    <img src={img} alt="" />
                    <button onClick={() => removeNewBanner(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}

                <div
                  className="apd-image-box"
                  onClick={() => document.getElementById("banner-img").click()}
                >
                  {loadingBanner ? <CircularProgress /> : <FaCloudUploadAlt />}
                </div>
              </div>

              <input
                id="banner-img"
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleBannerChange}
              />
            </div>

            <div className="apd-form-group apd-banner-toggle">
              <label> Afficher dans le banner accueil</label>

              <div
                className={`apd-switch ${formFields.isDisplayOnHomeBanner ? "active" : ""}`}
                onClick={() =>
                  setFormFields((prev) => ({
                    ...prev,
                    isDisplayOnHomeBanner: !prev.isDisplayOnHomeBanner,
                  }))
                }
              >
                <div className="apd-slider"></div>
              </div>
            </div>

            <div className="apd-form-group">
              <label>Titre de la bannière</label>
              <input
                type="text"
                name="bannerTitleName"
                value={formFields.bannerTitleName}
                onChange={onChangeInput}
              />
            </div>

            <button
              type="submit"
              className="apd-publish-btn"
              disabled={loadingSubmit}
            >
              {loadingSubmit ? <CircularProgress /> : "Mettre à jour"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;