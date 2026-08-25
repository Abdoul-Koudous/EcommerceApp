import mongoose from "mongoose";

const blogBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["paragraph", "heading", "quote", "image", "list"],
      required: true,
    },

    // paragraph / heading / quote
    text: {
      type: String,
      default: "",
    },

    // quote
    author: {
      type: String,
      default: "",
    },

    // image
    src: {
      type: String,
      default: "",
    },

    caption: {
      type: String,
      default: "",
    },

    // list
    items: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// ✅ AJOUT : validation du contenu du bloc selon son type
// ✅ APRÈS (corrigé)
blogBlockSchema.pre("validate", function () {
  if (
    ["paragraph", "heading", "quote"].includes(this.type) &&
    !this.text?.trim()
  ) {
    throw new Error(`Le bloc "${this.type}" nécessite un texte`);
  }

  if (this.type === "image" && !this.src?.trim()) {
    throw new Error("Le bloc image nécessite une source (src)");
  }

  if (this.type === "list" && (!this.items || this.items.length === 0)) {
    throw new Error("Le bloc liste nécessite au moins un élément");
  }
});

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    excerpt: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
      default: "",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    // ✅ AJOUT : brouillon / publié
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    // Nombre de minutes.
    // Exemple : 6
    // Le client affichera ensuite : "6 min"
    readTime: {
      type: Number,
      default: 1,
      min: 1,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    author: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      role: {
        type: String,
        default: "",
        trim: true,
      },
    },

    body: {
      type: [blogBlockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ✅ AJOUT : recherche plus performante si le volume grossit
blogSchema.index({ title: "text", excerpt: "text" });

const BlogModel = mongoose.model("Blog", blogSchema);

export default BlogModel;