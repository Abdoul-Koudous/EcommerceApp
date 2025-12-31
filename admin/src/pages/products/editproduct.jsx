import React, { useEffect, useState, useContext, useRef,useMemo } from "react";
import { FaTimes, FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./addproduct.scss";
import { UserContext } from "../../UserContext/UserContext";
import { editData, uploadImages } from "../utils/api";
import HoverRating from "../../components/HoverRating/HoverRating";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";





const rams = ["2GB", "4GB", "8GB", "16GB"];
const sizes = ["S", "M", "L", "XL"];
const weights = ["0.5kg", "1kg", "2kg", "5kg", "8kg", "10kg"];



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
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="multi-select" ref={containerRef}>
      <label>{label}</label>
      <div className="selected-values" onClick={() => setOpen(!open)}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", color: "#222" }}>
          {selectedValues && selectedValues.length > 0
            ? selectedValues.map((val) => <span key={val} className="tag">{val}</span>)
            : <span>Sélectionne...</span>}

        </div>
        <span className="icon">{open ? <FaChevronUp /> : <FaChevronDown />}</span>
      </div>

      {open && (
        <div className="options">
          {options.map((opt) => (
            <div
              key={opt}
              className={`option ${selectedValues.includes(opt) ? "selected" : ""}`}
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
    extraImages: product.images?.slice(1) || [],
  });

  setSelectedCat(product.catId || "");
  setSelectedSubCat(product.subCatId || "");
  setSelectedThirdSubCat(product.thirdSubCatId || "");

  
}, [product]);


const mainCategories = categories || [];

const subCategories = useMemo(() => {
  return mainCategories.find(c => c._id === selectedCat)?.children || [];
}, [mainCategories, selectedCat]);

const thirdSubCategories = useMemo(() => {
  return subCategories.find(sc => sc._id === selectedSubCat)?.children || [];
}, [subCategories, selectedSubCat]);




  


  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields(() => ({ ...formFields, [name]: value }));
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
      setFormFields(prev => ({ ...prev, mainImage: url }));
    } else {
      const urls = files.map(file => URL.createObjectURL(file));
      setExtraImageFiles(prev => [...prev, ...files]);
      setFormFields(prev => ({
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


useEffect(() => {
  return () => {
    URL.revokeObjectURL(formFields.mainImage);
    formFields.extraImages.forEach(URL.revokeObjectURL);
  };
}, [formFields.mainImage, formFields.extraImages]);


// Supprimer une image secondaire
const removeExtraImage = (index) => {
  setExtraImageFiles(prev => prev.filter((_, i) => i !== index));
  setFormFields(prev => ({
    ...prev,
    extraImages: prev.extraImages.filter((_, i) => i !== index),
  }));
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

 const hasOldImages = product?.images?.length > 1;


  if (
    !hasOldImages &&
    (!formFields.extraImages || formFields.extraImages.length === 0) &&
    extraImageFiles.length === 0
  ) {
    return openToast("error", "Veuillez ajouter au moins une image secondaire");
  }
  if (!formFields.brand.trim())
    return openToast("error", "La marque du produit est obligatoire");

  if (formFields.countIntStock <= 0)
    return openToast("error", "Le stock doit être supérieur à zéro");
  if (formFields.discount < 0)
    return openToast("error", "La remise ne peut pas être négative");
  if (formFields.price < 0)
    return openToast("error", "Le prix ne peut pas être négatif");  
  if (formFields.oldPrice < 0)
    return openToast("error", "L'ancien prix ne peut pas être négatif");
  if (formFields.rating < 0 || formFields.rating > 5)
    return openToast("error", "La note doit être comprise entre 0 et 5");
  if (formFields.productRam.length === 0)
    return openToast("error", "Veuillez sélectionner au moins une option de RAM");  
  if (formFields.size.length === 0)
    return openToast("error", "Veuillez sélectionner au moins une taille");
  if (formFields.productWeight.length === 0)
    return openToast("error", "Veuillez sélectionner au moins un poids");
  if (formFields.discount > 100)
    return openToast("error", "La remise ne peut pas dépasser 100%"); 
  if (formFields.oldPrice > 0 && formFields.oldPrice < formFields.price)
    return openToast("error", "L'ancien prix doit être supérieur au prix actuel");
  if (!Number.isInteger(Number(formFields.countIntStock)))
    return openToast("error", "Le stock doit être un nombre entier");
  
  // 🔹 SUBMIT
  

  



  try {
  setLoadingSubmit(true);

  let finalImages = [];

  // Si on a de nouvelles images à uploader
  if (mainImageFile || extraImageFiles.length > 0) {
    const formData = new FormData();
    if (mainImageFile) formData.append("images", mainImageFile);
    extraImageFiles.forEach(f => formData.append("images", f));

    const uploadRes = await uploadImages("/api/product/uploadImages", formData);

    // Nouvelle image principale ? sinon garder l'ancienne
    finalImages.push(mainImageFile ? uploadRes.images[0] : formFields.mainImage);

    // Ajouter les anciennes images secondaires déjà présentes
    finalImages.push(...formFields.extraImages);

    // Ajouter les nouvelles images secondaires uploadées
    if (extraImageFiles.length > 0) {
      finalImages.push(...uploadRes.images.slice(mainImageFile ? 1 : 0));
    }

  } else {
    // Pas de nouvelles images => garder toutes les images existantes
    finalImages = [formFields.mainImage, ...formFields.extraImages];
  }

  // Préparer le payload final
  const payload = { ...formFields, images: finalImages };

  const res = await editData(`/api/product/updateProduct/${product._id}`, payload);

  if (!res?.success) throw new Error(res?.message || "Erreur de modification produit");

  openToast("success", res?.message || "Produit mis à jour");
  setTimeout(handleClose, 500);

} catch (error) {
  console.error(error);
  openToast("error", error.message || "Erreur serveur");
} finally {
  setLoadingSubmit(false);
}
};

useEffect(() => {
  if (
    selectedThirdSubCat &&
    !thirdSubCategories.find(t => t._id === selectedThirdSubCat)
  ) {
    setSelectedThirdSubCat("");
    setFormFields(prev => ({
      ...prev,
      thirdSubCatId: "",
      thirdsubCat: ""
    }));
  }
}, [thirdSubCategories, selectedThirdSubCat]);

  

 
  

  return (
    <div className="fullscreen-dialog">
      <div className={`dialog-content ${isClosing ? "closing" : "opening"}`}>
        <div className="dialog-header">
          <div className="header-left">
            <button className="close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Modifier le produit</h2>

          </div>
        </div>

        <div className="dialog-body">
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Nom du produit</label>
              <input
                type="text"
                name="name"
                value={formFields.name}
                onChange={onChangeInput}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formFields.description}
                onChange={onChangeInput}
              />
            </div>

            {/* Catégories */}
            <div className="row">
              <div className="form-group">
                <label>Catégorie</label>
              <select
                value={selectedCat}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = mainCategories.find((c) => c._id === value)?.name || "";

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
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              </div>
              <div className="form-group">


                <label>Sous-catégorie</label>
              <select
                name="subCatId"
                value={selectedSubCat}
                disabled={!selectedCat}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = subCategories.find((sc) => sc._id === value)?.name || "";

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
                  <option key={sc._id} value={sc._id}>{sc.name}</option>
                ))}
              </select>
              </div>
              <div className="form-group">

                <label>Sous-sous-catégorie</label>
              <select
                name="thirdSubCatId"
               
                disabled={!selectedSubCat}
                value={formFields.thirdSubCatId}
                onChange={(e) => {
                  const value = e.target.value;
                  const selectedName = thirdSubCategories.find(t => t._id === value)?.name || "";

                  setFormFields(prev => ({
                    ...prev,
                    thirdSubCatId: value,
                    thirdsubCat: selectedName
                  }));
                }}

              >
                <option value="">Sélectionne...</option>
                {thirdSubCategories.map((tsc) => (
                  <option key={tsc._id} value={tsc._id}>{tsc.name}</option>
                ))}
              </select>
              </div>


            </div>

            {/* Prix */}
            <div className="row">
              <div className="form-group">
                <label>Prix</label>
                <input
                  type="number"
                  name="price"
                  value={formFields.price}
                  onChange={onChangeInput}
                />
              </div>

              <div className="form-group">
                <label>Ancien prix</label>
                <input
                  type="number"
                  name="oldPrice"
                  value={formFields.oldPrice}
                  onChange={onChangeInput}
                />
              </div>

              <div className="form-group">
                <label>Note</label>
                <HoverRating
                  value={formFields.rating}
                  onChange={(val) =>
                    setFormFields((prev) => ({ ...prev, rating: val }))
                  }
                />
              </div>
            </div>


            {/* Infos */}
            <div className="row">
              <div className="form-group">
                <label>Produit en vedette ?</label>
                <select
                  value={String(formFields.isFeatured)}
                  onChange={(e) =>
                    setFormFields(prev => ({
                      ...prev,
                      isFeatured: e.target.value === "true"
                    }))
                  }
                >
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>


              </div>

              <div className="form-group">
                <label> En Stock</label>
                <input
                  type="number"
                  name="countIntStock"
                  value={formFields.countIntStock}
                  onChange={onChangeInput}
                />
              </div>

              <div className="form-group">
                <label>Marque</label>
                <input
                  type="text"
                  name="brand"
                  value={formFields.brand}
                  onChange={onChangeInput}
                />
              </div>

              <div className="form-group">
                <label>Remise (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formFields.discount}
                  onChange={onChangeInput}
                />
              </div>
            </div>


            {/* Multi-selections + Rating */}
            <div className="row">
              <div className="form-group">
                <DropdownMultiSelect
                  label="La RAM"
                  options={rams}
                  selectedValues={formFields.productRam}
                  onChange={(vals) =>
                    setFormFields((prev) => ({ ...prev, productRam: vals }))
                  }
                />
              </div>

              <div className="form-group">
                <DropdownMultiSelect
                  label="Taille"
                  options={sizes}
                  selectedValues={formFields.size}
                  onChange={(vals) => {
                    setFormFields((prev) => ({ ...prev, size: vals }))
                  }}
                />
              </div>

              <div className="form-group">
                <DropdownMultiSelect
                  label="Poids"
                  options={weights}
                  selectedValues={formFields.productWeight}
                  onChange={(vals) => {
                    setFormFields((prev) => ({ ...prev, productWeight: vals }));
                  }}
                />
              </div>
            </div>

            {/* Images */}
            {/* Image principale */}
            <div className="image-upload">
              <label>Image principale</label>
              <div className="image-box" onClick={() => document.getElementById("main-img").click()}>
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
            <div className="image-upload">
              <label>Images secondaires</label>
              <div className="extra-images">
                {formFields.extraImages.map((img, i) => (
                  <div key={i} className="image-preview">
                    <img src={img} alt="" />
                    <button type="button" onClick={() => removeExtraImage(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <div className="image-box" onClick={() => document.getElementById("extra-img").click()}>
                  {loadingExtraImages ? <CircularProgress /> : <FaPlus />}
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


            <button type="submit" className="publish-btn" disabled={loadingSubmit}>
              {loadingSubmit ? <CircularProgress /> : "Mettre à jour"}
            </button>


          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
