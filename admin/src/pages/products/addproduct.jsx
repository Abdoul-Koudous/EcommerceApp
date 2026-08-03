import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaStar,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "./addproduct.scss";
import { UserContext } from "../../UserContext/UserContext";
import { fetchDataFromApi, postData, uploadImages } from "../utils/api";
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

const AddProduct = ({ onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const { categories, setCategories } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingMainImage, setLoadingMainImage] = useState(false);
  const [loadingExtraImages, setLoadingExtraImages] = useState(false);

  const descriptionRef = useRef(null); // ✅ ref pour l'auto-resize du textarea description

  const [bannerFiles, setBannerFiles] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);
  const [loadingBanner, setLoadingBanner] = useState(false);

  // STATES : options (API) vs selections (utilisateur)
  const [ramOptions, setRamOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [weightOptions, setWeightOptions] = useState([]);

  const [productRam, setProductRam] = useState([]);
  const [productSize, setProductSize] = useState([]);
  const [productWeight, setProductWeight] = useState([]);
  const [productFeatured, setProductFeatured] = useState("");
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
    category: "",
    catName: "",
    catId: "",
    subCat: "",
    thirdsubCat: "",
    subCatId: "",
    thirdSubCatId: "",
    countIntStock: 0,
    rating: 0,
    isFeatured: false, // ✅ valeur par défaut explicite (au lieu de "") : le select affiche "Non" dès le départ
    discount: 0,
    productRam: [],
    size: [],
    productWeight: [],
    bannerTitleName: "",
    bannerimages: [],
    isDisplayOnHomeBanner: false,
  });

  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchDataFromApi("/api/category").then((res) => {
        if (res?.data) setCategories(res.data);
      });
    }
  }, [categories, setCategories]);

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
  const selectedCategory = mainCategories.find(
    (cat) => cat._id === selectedCat,
  );
  const subCategories = selectedCategory?.children || [];
  const selectedSubCategory = subCategories.find(
    (sub) => sub._id === selectedSubCat,
  );
  const thirdSubCategories = useMemo(() => {
    const selSub = subCategories.find((sub) => sub._id === selectedSubCat);
    return selSub?.children || [];
  }, [subCategories, selectedSubCat]);

  const onChangeInput = (e) => {
    const { name, value } = e.target;

    setFormFields((prev) => ({
      ...prev,
      [name]: value,

      // 👇 seulement si vide
      ...(name === "name" &&
        !prev.bannerTitleName.trim() && {
          bannerTitleName: value,
        }),
    }));
  };

  // States pour les fichiers et prévisualisations
  const [mainImageFile, setMainImageFile] = useState(null);
  const [extraImageFiles, setExtraImageFiles] = useState([]);

  // Changer les images (prévisualisation)
  const handleImageChange = async (e, main = false) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      if (main) setLoadingMainImage(true);
      else setLoadingExtraImages(true);

      if (main) {
        const file = files[0];
        const url = URL.createObjectURL(file);

        setMainImageFile(file);
        setFormFields((prev) => ({ ...prev, mainImage: url }));
      } else {
        const urls = files.map((file) => URL.createObjectURL(file));
        setExtraImageFiles((prev) => [...prev, ...files]);
        setFormFields((prev) => ({
          ...prev,
          extraImages: [...prev.extraImages, ...urls],
        }));
      }
    } finally {
      if (main) setLoadingMainImage(false);
      else setLoadingExtraImages(false);

      e.target.value = ""; // pour pouvoir re-sélectionner les mêmes fichiers
    }
  };

  const handleBannerChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setLoadingBanner(true);

      const urls = files.map((file) => URL.createObjectURL(file));

      setBannerFiles((prev) => [...prev, ...files]);
      setBannerPreviews((prev) => [...prev, ...urls]);

      setFormFields((prev) => ({
        ...prev,
        bannerimages: [...(prev.bannerimages || []), ...urls],
      }));
    } finally {
      setLoadingBanner(false);
      e.target.value = "";
    }
  };

  const removeBannerImage = (index) => {
    setBannerFiles((prev) => prev.filter((_, i) => i !== index));
    setBannerPreviews((prev) => prev.filter((_, i) => i !== index));

    setFormFields((prev) => ({
      ...prev,
      bannerimages: prev.bannerimages.filter((_, i) => i !== index),
    }));
  };

  // Supprimer une image secondaire
  const removeExtraImage = (index) => {
    setExtraImageFiles((prev) => prev.filter((_, i) => i !== index));
    setFormFields((prev) => ({
      ...prev,
      extraImages: prev.extraImages.filter((_, i) => i !== index),
    }));
  };

  const handleChangeProductFeatured = (event) => {
    setProductFeatured(event.target.value);
    setFormFields((prev) => ({ ...prev, isFeatured: event.target.value }));
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

    if (!mainImageFile)
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
    // ✅ cette règle ne s'applique que si un ancien prix a été renseigné (> 0) ;
    // sinon on considère qu'il n'y a simplement pas de promo affichée sur ce produit
    if (
      Number(formFields.oldPrice) > 0 &&
      Number(formFields.oldPrice) < Number(formFields.price)
    )
      return openToast(
        "error",
        "L'ancien prix doit être supérieur au prix actuel",
      );
    // ✅ retiré : le blocage sur isFeatured === "" — la valeur par défaut (false) est maintenant valide
    if (formFields.countIntStock % 1 !== 0)
      return openToast("error", "Le stock doit être un nombre entier");
    if (formFields.isDisplayOnHomeBanner && bannerFiles.length === 0) {
      return openToast("error", "Ajoute au moins une image banner");
    }
    // 🔹 SUBMIT

    try {
      setLoadingSubmit(true);

      // 🔹 UPLOAD IMAGES
      const formData = new FormData();
      formData.append("images", mainImageFile);
      extraImageFiles.forEach((file) => formData.append("images", file));

      const uploadRes = await uploadImages(
        "/api/product/uploadImages",
        formData,
      );

      if (!uploadRes || uploadRes.error || !uploadRes.images?.length) {
        throw new Error(uploadRes?.message || "Erreur upload images");
      }

      let bannerUrls = [];

      if (bannerFiles.length > 0) {
        const bannerData = new FormData();
        bannerFiles.forEach((file) => {
          bannerData.append("bannerimages", file);
        });

        const bannerRes = await uploadImages(
          "/api/product/uploadBannerImages",
          bannerData,
        );

        if (!bannerRes || bannerRes.error) {
          throw new Error("Erreur upload banner");
        }

        bannerUrls = bannerRes.images;
      }

      // 🔹 PAYLOAD
      const payload = {
        ...formFields,
        images: uploadRes.images,
        bannerimages: bannerUrls,
        bannerTitleName: formFields.bannerTitleName?.trim() || formFields.name,
        category: formFields.catId,
        thirdSubCatId: formFields.thirdSubCatId || null,
        isDisplayOnHomeBanner: formFields.isDisplayOnHomeBanner,
      };

      // 🔹 CREATE PRODUCT
      const res = await postData("/api/product/create", payload);

      if (!res?.success) {
        throw new Error(res?.message || "Erreur ajout produit");
      }

      openToast("success", "Produit ajouté avec succès");
      setTimeout(() => handleClose(), 500);
    } catch (error) {
      console.error(error);
      openToast("error", error.message || "Erreur serveur");
    } finally {
      setLoadingSubmit(false);
    }
  };

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

  // ✅ auto-resize du textarea description à chaque changement de contenu
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
            <h2>Ajouter un produit</h2>
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
                    setFormFields((prev) => ({
                      ...prev,
                      catId: value,
                      category: value,
                      catName: selected, // <-- ajoute le nom ici
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
                    setFormFields((prev) => ({
                      ...prev,
                      subCatId: value,
                      subCat: selected, // <-- nom de la sous-catégorie
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
                  value={selectedThirdSubCat}
                  disabled={!selectedSubCat}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedThirdSubCat(value);
                    const selectedName =
                      thirdSubCategories.find((tsc) => tsc._id === value)
                        ?.name || "";
                    setFormFields((prev) => ({
                      ...prev,
                      thirdSubCatId: value || "",
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
                  name="isFeatured"
                  value={formFields.isFeatured}
                  onChange={(e) =>
                    setFormFields((prev) => ({
                      ...prev,
                      isFeatured: e.target.value === "true", // conversion en Boolean
                    }))
                  }
                >
                  <option value={false}>Non</option>
                  <option value={true}>Oui</option>
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
                  <>
                    <FaCloudUploadAlt />
                    <span>Ajouter des images</span>
                  </>
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
                {formFields.extraImages.map((img, i) => (
                  <div key={i} className="apd-image-preview">
                    <img src={img} alt="" />
                    <button type="button" onClick={() => removeExtraImage(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <div
                  className="apd-image-box"
                  onClick={() => document.getElementById("extra-img").click()}
                >
                  {loadingExtraImages ? (
                    <CircularProgress />
                  ) : (
                    <>
                      <FaCloudUploadAlt />
                      <span>Ajouter des images</span>
                    </>
                  )}
                </div>
              </div>
              <input
                id="extra-img"
                type="file"
                hidden
                accept="image/*"
                multiple
                onChange={(e) => handleImageChange(e, false)}
              />
            </div>
            <div className="apd-image-upload">
              <label>Images Banner</label>

              <div className="apd-extra-images">
                {/* Preview */}
                {bannerPreviews.map((img, i) => (
                  <div key={i} className="apd-image-preview">
                    <img src={img} alt="" />
                    <button type="button" onClick={() => removeBannerImage(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}

                {/* Box upload */}
                <div
                  className="apd-image-box"
                  onClick={() => {
                    if (!loadingBanner) {
                      document.getElementById("banner-img").click();
                    }
                  }}
                >
                  {loadingBanner ? (
                    <CircularProgress />
                  ) : (
                    <>
                      <FaCloudUploadAlt />
                      <span>Ajouter</span>
                    </>
                  )}
                </div>
              </div>

              <input
                id="banner-img"
                type="file"
                hidden
                accept="image/*"
                multiple
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
              <label>Titre de la banniere</label>
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
              {loadingSubmit ? <CircularProgress /> : "Publier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;