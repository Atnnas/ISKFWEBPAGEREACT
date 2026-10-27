import mongoose from 'mongoose';

const TechniqueItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  group: {
    type: String,
    enum: ['kihon', 'kumite', 'kata'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  stance: {
    type: String,
    default: 'Zenkutsu Dachi',
    trim: true,
  },
  direction: {
    type: String,
    default: 'Adelante (Mae)',
    trim: true,
  },
  repetitions: {
    type: Number,
    default: 3,
    min: 1,
    max: 20,
  },
  tripType: {
    type: String,
    enum: ['ida_y_vuelta', 'solo_ida'],
    default: 'ida_y_vuelta',
  },
  order: {
    type: Number,
    default: 0,
  },
  embusen: {
    type: String,
    default: 'Embusen Oficial',
    trim: true,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  }
}, { _id: false });

const TechnicalAspectItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    default: 'tsuki',
  },
  categoryLabel: {
    type: String,
    default: '1. Aspectos Técnicos',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    default: '',
    trim: true,
  },
  points: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  order: {
    type: Number,
    default: 0,
  }
}, { _id: false, strict: false });

const ExamSyllabusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  currentRank: {
    type: String,
    required: true,
    trim: true,
  },
  targetRank: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  isOfficial: {
    type: Boolean,
    default: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  techniques: [TechniqueItemSchema],
  technicalAspects: [TechnicalAspectItemSchema],
  createdBy: {
    type: String,
    default: 'Comisión Técnica ISKF',
  }
}, {
  timestamps: true,
  collection: 'ExamSyllabi',
  strict: false
});

ExamSyllabusSchema.index({ targetRank: 1, name: 1, version: -1 });

if (mongoose.models && mongoose.models.ExamSyllabus) {
  delete mongoose.models.ExamSyllabus;
}
const ExamSyllabus = mongoose.model('ExamSyllabus', ExamSyllabusSchema);

export default ExamSyllabus;

