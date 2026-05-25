import mongoose from 'mongoose';

const DojoSchema = new mongoose.Schema({
    idName: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    }, // Corresponds to 'id' in dojosData (e.g. "kamae", "kuma")
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    province: { 
        type: String, 
        required: true,
        trim: true
    },
    sensei: { 
        type: String, 
        required: true,
        trim: true
    },
    senseiImage: { 
        type: String, 
        default: '/images/dojos/default_sensei.jpg'
    },
    rank: { 
        type: String, 
        default: ''
    },
    profession: { 
        type: String, 
        default: ''
    },
    logo: { 
        type: String, 
        default: '/images/dojos/default_logo.jpg'
    },
    phone: { 
        type: String, 
        default: ''
    },
    email: { 
        type: String, 
        default: ''
    },
    fax: { 
        type: String, 
        default: ''
    },
    website: { 
        type: String, 
        default: ''
    },
    address: { 
        type: String, 
        default: ''
    },
    detailsUrl: { 
        type: String, 
        default: '#'
    }
}, {
    timestamps: true
});

const Dojo = mongoose.models.Dojo || mongoose.model('Dojo', DojoSchema);

export default Dojo;
