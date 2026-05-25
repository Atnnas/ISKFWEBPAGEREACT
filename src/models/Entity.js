import mongoose from 'mongoose';

const EntitySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    logoUrl: { 
        type: String, 
        default: '/images/dojos/default_logo.jpg'
    },
    flagUrl: { 
        type: String, 
        default: ''
    }
}, {
    timestamps: true
});

const Entity = mongoose.models.Entity || mongoose.model('Entity', EntitySchema);

export default Entity;
