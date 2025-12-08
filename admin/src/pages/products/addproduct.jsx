import React, { useEffect, useState } from "react";
import { FaTimes, FaStar, FaPlus } from "react-icons/fa";
import "./addproduct.scss";

const categories = ["Électronique", "Vêtements", "Maison"];
const subCategories = ["Sous-catégorie 1", "Sous-catégorie 2", "Sous-catégorie 3"];
const optionsYesNo = ["Oui", "Non"];
const rams = ["2GB", "4GB", "8GB", "16GB"];
const sizes = ["S", "M", "L", "XL"];
const weights = ["0.5kg", "1kg", "2kg", "5kg"];

const AddProduct = ({ onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    description: "",
    categorie: "",
    sousCategorie: "",
    prix: "",
    ancienPrix: "",
    featured: "",
    stock: "",
    marque: "",
    discount: "",
    ram: "",
    poids: "",
    taille: "",
    rating: 0,
    mainImage: null,
    extraImages: [],
  });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, main = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (main) {
      setForm((prev) => ({ ...prev, mainImage: url }));
    } else {
      setForm((prev) => ({
        ...prev,
        extraImages: [...prev.extraImages, url],
      }));
    }
  };

  const removeExtraImage = (index) => {
    setForm((prev) => ({
      ...prev,
      extraImages: prev.extraImages.filter((_, i) => i !== index),
    }));
  };

  const setRating = (value) => {
    setForm((prev) => ({ ...prev, rating: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
    alert("Produit ajouté !");
  };

  return (
    <div className="fullscreen-dialog">
      <div className={`dialog-content ${isClosing ? "closing" : "opening"}`}>
        <div className="dialog-header">
          <div className="header-left">
            <button className="close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Ajouter un produit</h2>
          </div>
        </div>

        <div className="dialog-body">
          <form onSubmit={handleSubmit} className="product-form">
            <input
              type="text"
              placeholder="Nom du produit"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              required
            />
            <textarea
              placeholder="Description du produit"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
            <div className="row">
              <select name="categorie" value={form.categorie} onChange={handleChange}>
                <option value="">Catégorie</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                name="sousCategorie"
                value={form.sousCategorie}
                onChange={handleChange}
              >
                <option value="">Sous-catégorie</option>
                {subCategories.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <input
                type="number"
                placeholder="Prix"
                name="prix"
                value={form.prix}
                onChange={handleChange}
              />
              <input
                type="number"
                placeholder="Ancien prix"
                name="ancienPrix"
                value={form.ancienPrix}
                onChange={handleChange}
              />
            </div>

            <div className="row">
              <select name="featured" value={form.featured} onChange={handleChange}>
                <option value="">Produit en vedette ?</option>
                {optionsYesNo.map((o, i) => (
                  <option key={i} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Stock"
                name="stock"
                value={form.stock}
                onChange={handleChange}
              />
              <input
                type="text"
                placeholder="Marque"
                name="marque"
                value={form.marque}
                onChange={handleChange}
              />
              <input
                type="number"
                placeholder="Discount (%)"
                name="discount"
                value={form.discount}
                onChange={handleChange}
              />
            </div>

            <div className="row">
              <select name="ram" value={form.ram} onChange={handleChange}>
                <option value="">RAM</option>
                {rams.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select name="poids" value={form.poids} onChange={handleChange}>
                <option value="">Poids</option>
                {weights.map((w, i) => (
                  <option key={i} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <select name="taille" value={form.taille} onChange={handleChange}>
                <option value="">Taille</option>
                {sizes.map((s, i) => (
                  <option key={i} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FaStar
                    key={i}
                    className={i <= form.rating ? "filled" : ""}
                    onClick={() => setRating(i)}
                  />
                ))}
              </div>
            </div>

            <div className="image-upload">
              <label>Image principale</label>
              <div className="image-box" onClick={() => document.getElementById("main-img").click()}>
                {form.mainImage ? (
                  <img src={form.mainImage} alt="Main" />
                ) : (
                  <FaPlus className="plus-icon" />
                )}
              </div>
              <input
                type="file"
                id="main-img"
                accept="image/*"
                onChange={(e) => handleImageChange(e, true)}
                style={{ display: "none" }}
              />
            </div>

            <div className="image-upload">
              <label>Images secondaires</label>
              <div className="extra-images">
                {form.extraImages.map((img, i) => (
                  <div key={i} className="image-preview">
                    <img src={img} alt={`Extra ${i}`} />
                    <button type="button" onClick={() => removeExtraImage(i)}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <div className="image-box" onClick={() => document.getElementById("extra-img").click()}>
                  <FaPlus className="plus-icon" />
                </div>
              </div>
              <input
                type="file"
                id="extra-img"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>

            <button type="submit" className="publish-btn">
              Publier / Voir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
