import mongoose from 'mongoose';

const RankCostItemSchema = new mongoose.Schema({
  rank: { type: String, required: true },
  senseiDojo: { type: Number, default: 0, min: 0 },
  directorGeneral: { type: Number, default: 0, min: 0 },
  iskfCr: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true }
}, { _id: false });

const ExamCostConfigSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Configuración Oficial de Costos de Examen ISKF',
    trim: true,
  },
  currency: {
    type: String,
    enum: ['CRC', 'USD'],
    default: 'CRC',
  },
  currencySymbol: {
    type: String,
    default: '₡',
  },
  // Rubros Generales Principales
  senseiDojo: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  directorGeneral: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  iskfCr: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  // Desglose opcional por grado / cinturón
  rankCosts: [RankCostItemSchema],
  updatedBy: {
    type: String,
    default: 'Administración',
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

ExamCostConfigSchema.pre('save', function (next) {
  this.total = (Number(this.senseiDojo) || 0) + (Number(this.directorGeneral) || 0) + (Number(this.iskfCr) || 0);
  if (Array.isArray(this.rankCosts)) {
    this.rankCosts.forEach(rc => {
      rc.total = (Number(rc.senseiDojo) || 0) + (Number(rc.directorGeneral) || 0) + (Number(rc.iskfCr) || 0);
    });
  }
  next();
});

export default mongoose.models.ExamCostConfig || mongoose.model('ExamCostConfig', ExamCostConfigSchema);
