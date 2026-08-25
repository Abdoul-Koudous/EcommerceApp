import React, {
  useState,
  useEffect,
  useContext,
} from "react";

import axios from "axios";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaSave,
  FaImage,
} from "react-icons/fa";

import {
  fetchDataFromApi,
} from "../utils/api";

import {
  ToastContext,
} from "../../context/ToastContext";

import BlockEditor from "../../components/BlockEditor";

import "./blog.scss";


const apiUrl = import.meta.env.VITE_API_URL;

/*
 * IMPORTANT :
 * On appelle axios directement ici (au lieu de postData/editData/uploadImages
 * dans utils/api.js) pour pouvoir récupérer le vrai message d'erreur envoyé
 * par le backend (error.response?.data?.message). Les fonctions de utils/api.js
 * ne le font pas actuellement pour ces cas et ne doivent pas être modifiées.
 */

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
    ...extra,
  };
}

async function saveBlog(id, payload) {
  try {
    const response = id
      ? await axios.put(
          `${apiUrl}/api/blog/update/${id}`,
          payload,
          {
            headers: authHeaders({
              "Content-Type": "application/json",
            }),
          }
        )
      : await axios.post(
          `${apiUrl}/api/blog/add`,
          payload,
          {
            headers: authHeaders({
              "Content-Type": "application/json",
            }),
          }
        );

    return response.data;
  } catch (error) {
    console.error(error);

    return {
      error: true,
      message:
        error.response?.data?.message ||
        error.message ||
        "Erreur serveur",
    };
  }
}

async function uploadCoverImage(file) {
  try {
    const formData = new FormData();

    formData.append("images", file);

    const response = await axios.post(
      `${apiUrl}/api/blog/uploadImages`,
      formData,
      {
        headers: authHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    console.error(error);

    return {
      error: true,
      message:
        error.response?.data?.message ||
        error.message ||
        "Erreur serveur",
    };
  }
}


const EMPTY_FORM = {
  title: "",
  excerpt: "",
  category: "",
  image: "",
  featured: false,
  readTime: 1,
  date: "",
  author: {
    name: "",
    role: "",
  },
  body: [],
};


export default function BlogForm() {
  const { id } = useParams();

  const isEdit = Boolean(id);

  const navigate =
    useNavigate();

  const { showToast } =
    useContext(ToastContext);


  const [form, setForm] =
    useState(EMPTY_FORM);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);


  /*
   * Conversion d'une date MongoDB
   * vers le format attendu par input type="date".
   */
  const formatDateForInput =
    (value) => {
      if (!value) {
        return "";
      }

      const date =
        new Date(value);

      if (Number.isNaN(
        date.getTime()
      )) {
        return "";
      }

      return date
        .toISOString()
        .split("T")[0];
    };


  /*
   * Chargement catégories + article
   */
  useEffect(() => {
    const loadData =
      async () => {
        try {
          const categoryRes =
            await fetchDataFromApi(
              "/api/blog/getCategories"
            );

          if (
            !categoryRes?.error
          ) {
            setCategories(
              Array.isArray(
                categoryRes?.categories
              )
                ? categoryRes.categories
                : []
            );
          }


          if (!isEdit) {
            setForm({
              ...EMPTY_FORM,
              date:
                formatDateForInput(
                  new Date()
                ),
            });

            return;
          }


          const blogRes =
            await fetchDataFromApi(
              `/api/blog/getOne/${id}`
            );

          if (
            blogRes?.error ||
            !blogRes?.blog
          ) {
            throw new Error(
              blogRes?.message ||
                "Article introuvable"
            );
          }


          const blog =
            blogRes.blog;


          setForm({
            title:
              blog.title || "",

            excerpt:
              blog.excerpt || "",

            category:
              blog.category || "",

            image:
              blog.image || "",

            featured:
              Boolean(
                blog.featured
              ),

            readTime:
              Number(
                blog.readTime
              ) || 1,

            date:
              formatDateForInput(
                blog.date
              ),

            author: {
              name:
                blog.author
                  ?.name || "",

              role:
                blog.author
                  ?.role || "",
            },

            body:
              Array.isArray(
                blog.body
              )
                ? blog.body
                : [],
          });

        } catch (error) {
          console.error(error);

          showToast?.(
            error.message ||
              "Article introuvable",
            "error"
          );

          navigate("/blog");
        } finally {
          setLoading(false);
        }
      };


    loadData();
  }, [
    id,
    isEdit,
    navigate,
    showToast,
  ]);


  /*
   * Modification d'un champ.
   */
  const handleChange =
    (field, value) => {
      setForm((previous) => ({
        ...previous,
        [field]: value,
      }));
    };


  /*
   * Modification auteur.
   */
  const handleAuthorChange =
    (field, value) => {
      setForm((previous) => ({
        ...previous,

        author: {
          ...previous.author,
          [field]: value,
        },
      }));
    };


  /*
   * Upload couverture.
   */
  const handleCoverUpload =
    async (file) => {
      if (!file) {
        return;
      }

      try {
        const res =
          await uploadCoverImage(file);

        if (res?.error) {
          throw new Error(
            res.message ||
              "Échec upload de la couverture"
          );
        }

        const url =
          res?.images?.[0];


        if (!url) {
          throw new Error(
            "URL image manquante dans la réponse"
          );
        }


        handleChange(
          "image",
          url
        );


        showToast?.(
          "Couverture uploadée",
          "success"
        );

      } catch (error) {
        console.error(error);

        showToast?.(
          error.message ||
            "Échec upload de la couverture",
          "error"
        );
      }
    };


  /*
   * Validation.
   */
  const validate =
    () => {
      if (
        !form.title.trim()
      ) {
        return "Le titre est requis";
      }

      if (
        !form.excerpt.trim()
      ) {
        return "L'extrait est requis";
      }

      if (
        !form.category.trim()
      ) {
        return "La catégorie est requise";
      }

      if (!form.image) {
        return "La couverture est requise";
      }

      if (
        !Array.isArray(
          form.body
        ) ||
        form.body.length === 0
      ) {
        return "Ajoute au moins un bloc de contenu";
      }

      if (
        !form.readTime ||
        Number(form.readTime) < 1
      ) {
        return "Le temps de lecture doit être d'au moins 1 minute";
      }

      return null;
    };


  /*
   * Enregistrement.
   */
  const handleSubmit =
    async (e) => {
      e.preventDefault();


      const validationError =
        validate();


      if (validationError) {
        showToast?.(
          validationError,
          "error"
        );

        return;
      }


      setSaving(true);


      try {
        const payload = {
          ...form,

          readTime:
            Number(form.readTime),

          /*
           * Si aucune date n'est sélectionnée,
           * le backend utilisera Date.now().
           */
          date:
            form.date || undefined,
        };


        const res =
          await saveBlog(
            isEdit ? id : null,
            payload
          );


        if (res?.error) {
          throw new Error(
            res.message ||
              "Échec de l'enregistrement"
          );
        }


        showToast?.(
          isEdit
            ? "Article mis à jour"
            : "Article créé",
          "success"
        );


        navigate("/blog");

      } catch (error) {
        console.error(error);

        showToast?.(
          error.message ||
            "Échec de l'enregistrement",
          "error"
        );
      } finally {
        setSaving(false);
      }
    };


  if (loading) {
    return (
      <div className="blog-form__loading">
        Chargement...
      </div>
    );
  }


  return (
    <form
      className="blog-form"
      onSubmit={handleSubmit}
    >

      <div className="blog-form__header">

        <h2>
          {isEdit
            ? "Éditer l'article"
            : "Nouvel article"}
        </h2>


        <button
          type="submit"
          className="blog-form__save"
          disabled={saving}
        >
          <FaSave />

          {saving
            ? "Enregistrement..."
            : "Enregistrer"}
        </button>

      </div>


      <div className="blog-form__grid">

        <div className="blog-form__main">

          <label>
            Titre

            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                handleChange(
                  "title",
                  e.target.value
                )
              }
            />
          </label>


          <label>
            Extrait

            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) =>
                handleChange(
                  "excerpt",
                  e.target.value
                )
              }
            />
          </label>


          <div className="blog-form__section-title">
            Contenu de l'article
          </div>


          <BlockEditor
            blocks={form.body}
            onChange={(blocks) =>
              handleChange(
                "body",
                blocks
              )
            }
          />

        </div>


        <aside className="blog-form__sidebar">

          <label>
            Couverture

            <div className="blog-form__cover">

              {form.image ? (
                <img
                  src={form.image}
                  alt=""
                />
              ) : (
                <div className="blog-form__cover-placeholder">
                  <FaImage />
                </div>
              )}


              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleCoverUpload(
                    e.target.files?.[0]
                  )
                }
              />

            </div>

          </label>


          <label>
            Catégorie

            <input
              type="text"
              list="blog-categories"
              value={form.category}
              onChange={(e) =>
                handleChange(
                  "category",
                  e.target.value
                )
              }
            />

            <datalist id="blog-categories">

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  />
                )
              )}

            </datalist>

          </label>


          <label>
            Temps de lecture

            <input
              type="number"
              min="1"
              step="1"
              placeholder="ex: 5"
              value={form.readTime}
              onChange={(e) =>
                handleChange(
                  "readTime",
                  e.target.value
                )
              }
            />

            <small>
              Durée estimée en minutes.
              Exemple : 5 signifie
              « 5 min de lecture ».
            </small>
          </label>


          <label>
            Date de publication

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                handleChange(
                  "date",
                  e.target.value
                )
              }
            />
          </label>


          <label>
            Auteur — nom

            <input
              type="text"
              value={
                form.author.name
              }
              onChange={(e) =>
                handleAuthorChange(
                  "name",
                  e.target.value
                )
              }
            />
          </label>


          <label>
            Auteur — rôle

            <input
              type="text"
              value={
                form.author.role
              }
              onChange={(e) =>
                handleAuthorChange(
                  "role",
                  e.target.value
                )
              }
            />
          </label>


          <label className="blog-form__checkbox">

            <input
              type="checkbox"
              checked={
                form.featured
              }
              onChange={(e) =>
                handleChange(
                  "featured",
                  e.target.checked
                )
              }
            />

            Mettre en avant
            (remplace l'article
            vedette actuel)

          </label>

        </aside>

      </div>

    </form>
  );
}