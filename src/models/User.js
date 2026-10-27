import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['visor', 'editor', 'sensei', 'admin'],
    default: 'visor',
  },
  dojoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dojo',
    default: null,
  },
  dojoName: {
    type: String,
    default: '',
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { collection: 'Users' });

export default mongoose.models.User || mongoose.model('User', UserSchema);
