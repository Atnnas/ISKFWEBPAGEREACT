import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  birthDate: {
    type: Date,
    required: false,
    default: null,
  },
  currentRank: {
    type: String,
    required: true,
    trim: true,
    default: '10° Kyu (Cinta Blanca)',
  },
  dojoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dojo',
    required: true,
  },
  dojoName: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  photo: {
    type: String,
    default: '',
    trim: true,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  positiveAspects: {
    type: String,
    default: '',
    trim: true,
  },
  hasSpecialCondition: {
    type: Boolean,
    default: false,
  },
  specialCondition: {
    type: String,
    default: '',
    trim: true,
  },
  isPromotedForExam: {
    type: Boolean,
    default: false,
  },
  promotedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
  collection: 'Students'
});

// Índice compuesto para agilizar búsquedas por dojo y orden alfabético
StudentSchema.index({ dojoId: 1, name: 1 });

const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

export default Student;
