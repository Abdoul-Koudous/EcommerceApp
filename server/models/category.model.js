import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    images:[
        {
            type: String,
        }
    ],
    parentCatName:{
        type:String,
    },
    parentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categorie',
        default: null
    },

    // ✅ NOUVEAU : taux de taxe par défaut pour tous les produits de cette
    // catégorie. null = hérite du taux global (defaultTaxRate dans Settings).
    // Un produit individuel peut lui-même surcharger cette valeur.
    taxRate: {
        type: Number,
        default: null
    },

},{timestamps:true});

const CategoryModel = mongoose.model('Categorie', categorySchema)


export default CategoryModel