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

},{timestamps:true});

const CategoryModel = mongoose.model('Categorie', categorySchema)


export default CategoryModel