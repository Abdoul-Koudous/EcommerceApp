import React, {
  useContext,
} from "react";

import axios from "axios";

import {
  FaTrash,
  FaPlus,
  FaGripVertical,
} from "react-icons/fa";

import {
  ToastContext,
} from "../../context/ToastContext";

import "./blockEditor.scss";


const apiUrl = import.meta.env.VITE_API_URL;

/*
 * IMPORTANT :
 * On appelle axios directement ici (au lieu de uploadImages dans utils/api.js)
 * pour pouvoir récupérer le vrai message d'erreur envoyé par le backend
 * (error.response?.data?.message). utils/api.js ne le fait pas actuellement
 * et ne doit pas être modifié.
 */
async function uploadContentImage(file) {
  try {
    const formData = new FormData();

    formData.append("images", file);

    const response = await axios.post(
      `${apiUrl}/api/blog/uploadImages`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accesstoken")}`,
        },
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


/*
 * Structure des blocs.
 *
 * IMPORTANT :
 * Doit correspondre exactement à blogBlockSchema (backend).
 * - quote a un champ "author" (voir blogBlockSchema.author).
 * - image utilise "src", PAS "url".
 */
const BLOCK_TEMPLATES = {

  paragraph: {
    type: "paragraph",
    text: "",
  },

  heading: {
    type: "heading",
    text: "",
  },

  quote: {
    type: "quote",
    text: "",
    author: "",
  },

  image: {
    type: "image",
    src: "",
    caption: "",
  },

  list: {
    type: "list",
    items: [""],
  },

};


const BLOCK_LABELS = {

  paragraph: "Paragraphe",

  heading: "Titre (H2)",

  quote: "Citation",

  image: "Image",

  list: "Liste",

};


export default function BlockEditor({
  blocks,
  onChange,
}) {

  const { showToast } =
    useContext(ToastContext);


  /*
   * Ajouter un bloc.
   */
  const addBlock =
    (type) => {

      const template =
        BLOCK_TEMPLATES[type];

      if (!template) {
        return;
      }


      /*
       * On clone également
       * les tableaux pour éviter
       * les références partagées.
       */
      const newBlock = {
        ...template,

        ...(template.items
          ? {
              items: [...template.items],
            }
          : {}),
      };


      onChange([
        ...blocks,
        newBlock,
      ]);
    };


  /*
   * Modifier un bloc.
   */
  const updateBlock =
    (index, patch) => {

      const next =
        blocks.map(
          (block, i) =>
            i === index
              ? {
                  ...block,
                  ...patch,
                }
              : block
        );


      onChange(next);
    };


  /*
   * Supprimer un bloc.
   */
  const removeBlock =
    (index) => {

      onChange(
        blocks.filter(
          (_, i) =>
            i !== index
        )
      );
    };


  /*
   * Déplacer un bloc.
   */
  const moveBlock =
    (index, direction) => {

      const target =
        index + direction;


      if (
        target < 0 ||
        target >= blocks.length
      ) {
        return;
      }


      const next = [
        ...blocks,
      ];


      [
        next[index],
        next[target],
      ] = [
        next[target],
        next[index],
      ];


      onChange(next);
    };


  /*
   * Upload d'une image de contenu.
   */
  const handleImageUpload =
    async (index, file) => {

      if (!file) {
        return;
      }


      try {

        const res =
          await uploadContentImage(
            file
          );

        if (res?.error) {
          throw new Error(
            res.message ||
              "Échec upload image"
          );
        }


        const src =
          res?.images?.[0];


        if (!src) {
          throw new Error(
            "URL image manquante dans la réponse"
          );
        }


        /*
         * IMPORTANT :
         * src et non url.
         */
        updateBlock(
          index,
          {
            src,
          }
        );


        showToast?.(
          "Image uploadée",
          "success"
        );

      } catch (error) {

        console.error(error);

        showToast?.(
          error.message ||
            "Échec upload image",
          "error"
        );

      }
    };


  /*
   * Modifier un élément de liste.
   */
  const updateListItem =
    (
      blockIndex,
      itemIndex,
      value
    ) => {

      const block =
        blocks[blockIndex];

      const items =
        Array.isArray(block.items)
          ? block.items.map(
              (item, i) =>
                i === itemIndex
                  ? value
                  : item
            )
          : [];


      updateBlock(
        blockIndex,
        {
          items,
        }
      );
    };


  /*
   * Ajouter un élément
   * à une liste.
   */
  const addListItem =
    (blockIndex) => {

      const block =
        blocks[blockIndex];

      const items =
        Array.isArray(block.items)
          ? block.items
          : [];


      updateBlock(
        blockIndex,
        {
          items: [
            ...items,
            "",
          ],
        }
      );
    };


  /*
   * Supprimer un élément
   * d'une liste.
   */
  const removeListItem =
    (
      blockIndex,
      itemIndex
    ) => {

      const block =
        blocks[blockIndex];

      const items =
        Array.isArray(block.items)
          ? block.items.filter(
              (_, i) =>
                i !== itemIndex
            )
          : [];


      updateBlock(
        blockIndex,
        {
          /*
           * Toujours garder au moins
           * un champ vide pour l'UI.
           */
          items:
            items.length > 0
              ? items
              : [""],
        }
      );
    };


  return (
    <div className="block-editor">

      <div className="block-editor__list">

        {blocks.length === 0 && (
          <p className="block-editor__empty">
            Aucun bloc. Ajoute le
            premier ci-dessous.
          </p>
        )}


        {blocks.map(
          (block, index) => (

            <div
              key={index}
              className="block-editor__item"
            >

              <div className="block-editor__item-header">

                <span className="block-editor__drag">
                  <FaGripVertical />
                </span>


                <span className="block-editor__type">
                  {
                    BLOCK_LABELS[
                      block.type
                    ] ||
                    block.type
                  }
                </span>


                <div className="block-editor__item-actions">

                  <button
                    type="button"
                    onClick={() =>
                      moveBlock(
                        index,
                        -1
                      )
                    }
                    disabled={
                      index === 0
                    }
                  >
                    ↑
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      moveBlock(
                        index,
                        1
                      )
                    }
                    disabled={
                      index ===
                      blocks.length - 1
                    }
                  >
                    ↓
                  </button>


                  <button
                    type="button"
                    className="block-editor__remove"
                    onClick={() =>
                      removeBlock(
                        index
                      )
                    }
                  >
                    <FaTrash />
                  </button>

                </div>

              </div>


              <div className="block-editor__item-body">

                {(
                  block.type ===
                    "paragraph" ||
                  block.type ===
                    "heading"
                ) && (

                  <textarea
                    rows={
                      block.type ===
                      "heading"
                        ? 1
                        : 4
                    }
                    placeholder={
                      block.type ===
                      "heading"
                        ? "Texte du titre..."
                        : "Texte du paragraphe..."
                    }
                    value={
                      block.text || ""
                    }
                    onChange={(e) =>
                      updateBlock(
                        index,
                        {
                          text:
                            e.target.value,
                        }
                      )
                    }
                  />

                )}


                {block.type ===
                  "quote" && (

                  <>

                    <textarea
                      rows={3}
                      placeholder="Texte de la citation..."
                      value={
                        block.text ||
                        ""
                      }
                      onChange={(e) =>
                        updateBlock(
                          index,
                          {
                            text:
                              e.target.value,
                          }
                        )
                      }
                    />


                    <input
                      type="text"
                      placeholder="Auteur de la citation (optionnel)"
                      value={
                        block.author ||
                        ""
                      }
                      onChange={(e) =>
                        updateBlock(
                          index,
                          {
                            author:
                              e.target.value,
                          }
                        )
                      }
                    />

                  </>

                )}


                {block.type ===
                  "image" && (

                  <div className="block-editor__image">

                    {block.src && (
                      <img
                        src={block.src}
                        alt=""
                        className="block-editor__image-preview"
                      />
                    )}


                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(
                          index,
                          e.target
                            .files?.[0]
                        )
                      }
                    />


                    <input
                      type="text"
                      placeholder="Légende (optionnel)"
                      value={
                        block.caption ||
                        ""
                      }
                      onChange={(e) =>
                        updateBlock(
                          index,
                          {
                            caption:
                              e.target.value,
                          }
                        )
                      }
                    />

                  </div>

                )}


                {block.type ===
                  "list" && (

                  <div className="block-editor__list-block">

                    {(
                      Array.isArray(
                        block.items
                      )
                        ? block.items
                        : [""]
                    ).map(
                      (
                        item,
                        itemIndex
                      ) => (

                        <div
                          key={
                            itemIndex
                          }
                          className="block-editor__list-row"
                        >

                          <input
                            type="text"
                            placeholder={`Élément ${
                              itemIndex + 1
                            }`}
                            value={
                              item
                            }
                            onChange={(e) =>
                              updateListItem(
                                index,
                                itemIndex,
                                e.target.value
                              )
                            }
                          />


                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(
                                index,
                                itemIndex
                              )
                            }
                            disabled={
                              (
                                block.items ||
                                []
                              ).length <=
                              1
                            }
                          >
                            <FaTrash />
                          </button>

                        </div>

                      )
                    )}


                    <button
                      type="button"
                      className="block-editor__add-item"
                      onClick={() =>
                        addListItem(
                          index
                        )
                      }
                    >
                      <FaPlus />
                      Ajouter un élément
                    </button>

                  </div>

                )}

              </div>

            </div>

          )
        )}

      </div>


      <div className="block-editor__toolbar">

        {Object.keys(
          BLOCK_TEMPLATES
        ).map((type) => (

          <button
            key={type}
            type="button"
            className="block-editor__add-btn"
            onClick={() =>
              addBlock(type)
            }
          >
            <FaPlus />

            {
              BLOCK_LABELS[type]
            }
          </button>

        ))}

      </div>

    </div>
  );
}