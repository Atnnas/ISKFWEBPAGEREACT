import mongoose from 'mongoose';

const TechnicalExamConsolidationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  studentRank: {
    type: String,
    default: '10° Kyu (Cinta Blanca)',
    trim: true,
  },
  targetRank: {
    type: String,
    default: '10° Kyu (Cinta Blanca)',
    trim: true,
  },
  dojoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dojo',
    required: true,
  },
  dojoName: {
    type: String,
    default: '',
    trim: true,
  },
  syllabusId: {
    type: String,
    default: '',
    trim: true,
  },
  syllabusName: {
    type: String,
    default: 'Temario Oficial ISKF',
    trim: true,
  },
  // Tribunal Evaluador (1 a 5 Senseis)
  evaluators: [{
    evaluatorName: { type: String, trim: true },
    evaluatorEmail: { type: String, trim: true },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    evaluatedAt: { type: Date, default: Date.now },
  }],
  evaluatorCount: {
    type: Number,
    default: 1,
  },
  // Promedios de calificaciones por rúbrica y por técnica
  averagedScores: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  averagedTechniqueScores: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Porcentaje promediado entre todos los Senseis
  overallPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  isPassed: {
    type: Boolean,
    default: false,
  },
  // Todas las observaciones recogidas de los evaluadores agrupadas por técnica
  rawObservationsByTechnique: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Enunciado final concretado y sintetizado por IA a partir de las notas de todos los Senseis
  aiConsolidatedSummary: {
    type: String,
    default: '',
    trim: true,
  },
  // Snapshot of the criteria (technicalAspects, techniques) used for this exam
  criteriaSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Sensei principal o administrador que expuso la evaluación
  consolidatedBy: {
    type: String,
    default: 'Comisión Técnica ISKF',
    trim: true,
  },
  status: {
    type: String,
    enum: ['borrador', 'expuesto', 'oficializado'],
    default: 'expuesto',
  },
  consolidatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  collection: 'TechnicalExamConsolidations'
});

TechnicalExamConsolidationSchema.index({ dojoId: 1, studentId: 1 });
TechnicalExamConsolidationSchema.index({ studentId: 1, syllabusId: 1 });

const TechnicalExamConsolidation = mongoose.models.TechnicalExamConsolidation || mongoose.model('TechnicalExamConsolidation', TechnicalExamConsolidationSchema);

export default TechnicalExamConsolidation;
