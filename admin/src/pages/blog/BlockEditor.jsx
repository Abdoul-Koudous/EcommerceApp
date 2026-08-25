import React from "react";
import {
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaCloudUploadAlt,
  FaTimes,
} from "react-icons/fa";
import { uploadImages as uploadImagesApi } from "../utils/api";

const BLOCK_TYPES = [
  { value: "paragraph", label: "Paragraphe" },
  { value: "heading", label: "Titre de section" },
  { value: "quote", label: "Citation" },
  { value: "image", label: "Image" },
  { value: "list", label: "Liste" },
];

let uid = 0;
const nextKey = () => `blk-${Date.now()}-${uid++}`;

export function createEmptyBlock(type = "paragraph") {
  return {
    _key: nextKey(),
    type,
    text: "",
    author: "",
    src: "",
    caption: "",
    items: type === "list" ? [""] : [],
    _file: null, // fichier en attente d'upload (uniquement type "image")
  };
}

export default function BlockEditor({ blocks, onChange }) {
  const updateBlock = (index, patch) => {
    const next = blocks.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeBlock = (index) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = blocks.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const addBlock = (type) => {
    onChange([...blocks, createEmptyBlock(type)]);
  };

  const handleImageSelect = (index, file) => {
    if (!file) return;
    updateBlock(index, {
      _file: file,
      src: URL.createObjectURL(file),
    });
  };

  const updateListItem = (index, itemIndex, value) => {
    const items = blocks[index].items.slice();
    items[itemIndex] = value;
    updateBlock(index, { items });
  };

  const addListItem = (index) => {
    updateBlock(index, { items: [...blocks[index].items, ""] });
  };

  const removeListItem = (index, itemIndex) => {
    const items = blocks[index].items.filter((_, i) => i !== itemIndex);
    updateBlock(index, { items });
  };

  return (
    <div className="blf-blocks">
      <label className="blf-blocks-label">Contenu de l'article</label>

      {blocks.length === 0 && (
        <p className="blf-blocks-empty">
          Aucun bloc pour l'instant — ajoute-en un ci-dessous.
        </p>
      )}

      {blocks.map((block, index) => (
        <div className="blf-block" key={block._key}>
          <div className="blf-block-header">
            <span className="blf-block-type">
              {BLOCK_TYPES.find((t) => t.value === block.type)?.label}
            </span>

            <div className="blf-block-actions">
              <button
                type="button"
                onClick={() => moveBlock(index, -1)}
                disabled={index === 0}
              >
                <FaArrowUp />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
              >
                <FaArrowDown />
              </button>
              <button type="button" onClick={() => removeBlock(index)}>
                <FaTrash />
              </button>
            </div>
          </div>

          {["paragraph", "heading"].includes(block.type) && (
            <textarea
              className="blf-block-textarea"
              placeholder="Texte du bloc..."
              value={block.text}
              onChange={(e) => updateBlock(index, { text: e.target.value })}
            />
          )}

          {block.type === "quote" && (
            <>
              <textarea
                className="blf-block-textarea"
                placeholder="Texte de la citation..."
                value={block.text}
                onChange={(e) => updateBlock(index, { text: e.target.value })}
              />
              <input
                type="text"
                placeholder="Auteur de la citation (optionnel)"
                value={block.author}
                onChange={(e) => updateBlock(index, { author: e.target.value })}
              />
            </>
          )}

          {block.type === "image" && (
            <div className="blf-block-image">
              <div
                className="blf-image-box"
                onClick={() =>
                  document.getElementById(`block-img-${block._key}`).click()
                }
              >
                {block.src ? <img src={block.src} alt="" /> : <FaCloudUploadAlt />}
              </div>
              <input
                id={`block-img-${block._key}`}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleImageSelect(index, e.target.files[0])}
              />
              <input
                type="text"
                placeholder="Légende (optionnel)"
                value={block.caption}
                onChange={(e) => updateBlock(index, { caption: e.target.value })}
              />
            </div>
          )}

          {block.type === "list" && (
            <div className="blf-block-list">
              {block.items.map((item, itemIndex) => (
                <div className="blf-list-item" key={itemIndex}>
                  <input
                    type="text"
                    value={item}
                    placeholder={`Élément ${itemIndex + 1}`}
                    onChange={(e) =>
                      updateListItem(index, itemIndex, e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeListItem(index, itemIndex)}
                    disabled={block.items.length <= 1}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="blf-list-add"
                onClick={() => addListItem(index)}
              >
                + Ajouter un élément
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="blf-add-block">
        {BLOCK_TYPES.map((t) => (
          <button type="button" key={t.value} onClick={() => addBlock(t.value)}>
            + {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Valide les blocs côté front (mêmes règles que le pre-validate du modèle
 * Mongoose) avant d'envoyer à l'API.
 */
export function validateBlocks(blocks) {
  if (!blocks || blocks.length === 0) {
    return "Ajoute au moins un bloc de contenu";
  }

  for (const block of blocks) {
    if (
      ["paragraph", "heading", "quote"].includes(block.type) &&
      !block.text?.trim()
    ) {
      return `Un bloc "${block.type}" est vide`;
    }
    if (block.type === "image" && !block.src) {
      return "Un bloc image n'a pas d'image";
    }
    if (
      block.type === "list" &&
      (!block.items || block.items.filter((i) => i.trim()).length === 0)
    ) {
      return "Un bloc liste n'a aucun élément";
    }
  }

  return null;
}

/**
 * Upload toutes les images des blocs de type "image" qui ont un fichier en
 * attente (_file), dans l'ordre, puis retourne les blocs nettoyés et prêts
 * pour l'API (sans _key ni _file, items sans lignes vides).
 */
export async function prepareBlocksForSubmit(blocks) {
  const pendingBlocks = blocks.filter((b) => b.type === "image" && b._file);

  let uploadedUrls = [];

  if (pendingBlocks.length > 0) {
    const formData = new FormData();
    pendingBlocks.forEach((b) => formData.append("images", b._file));

    const res = await uploadImagesApi("/api/blog/uploadImages", formData);

    if (!res || res.error || !res.images?.length) {
      throw new Error(res?.message || "Erreur upload des images du contenu");
    }

    uploadedUrls = res.images;
  }

  let uploadIndex = 0;

  return blocks.map((b) => {
    const clean = {
      type: b.type,
      text: b.text || "",
      author: b.author || "",
      src: b.src || "",
      caption: b.caption || "",
      items: (b.items || []).filter((i) => i.trim()),
    };

    if (b.type === "image" && b._file) {
      clean.src = uploadedUrls[uploadIndex];
      uploadIndex += 1;
    }

    return clean;
  });
}