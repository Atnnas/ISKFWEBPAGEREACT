import mongoose from 'mongoose';

const KanjiPartSchema = new mongoose.Schema({
    char: { type: String, required: true },
    romaji: { type: String, required: true },
    meaning: { type: String, required: true }
}, { _id: false });

const KataSchema = new mongoose.Schema({
    idName: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    category: {
        type: String,
        required: true,
        enum: ['BÁSICAS ELEMENTALES', 'INTERMEDIAS', 'AVANZADAS', 'SUPERIORES']
    },
    title: { 
        type: String, 
        required: true,
        trim: true 
    },
    kanji: { 
        type: String, 
        required: true,
        trim: true
    },
    meaning: { 
        type: String, 
        required: true,
        trim: true
    },
    kanjiParts: [KanjiPartSchema],
    detailsHtml: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Kata = mongoose.models.Kata || mongoose.model('Kata', KataSchema);

export default Kata;
