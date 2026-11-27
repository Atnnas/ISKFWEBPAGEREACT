import mongoose from 'mongoose';

const RankGradeItemSchema = new mongoose.Schema({
  rankKey: { type: String, required: true },
  rankLabel: { type: String, required: true },
  minScore: { type: Number, default: 70, min: 0, max: 100 },
  active: { type: Boolean, default: true }
}, { _id: false });

const ExamGradeConfigSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Configuración Oficial de Notas Mínimas de Aprobación por Cinturón ISKF',
    trim: true,
  },
  defaultMinScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100,
  },
  ranks: [RankGradeItemSchema],
  updatedBy: {
    type: String,
    default: 'Administrador',
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

export default mongoose.models.ExamGradeConfig || mongoose.model('ExamGradeConfig', ExamGradeConfigSchema);
