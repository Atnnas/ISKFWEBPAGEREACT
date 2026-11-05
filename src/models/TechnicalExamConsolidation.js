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
  callId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechnicalExamCall',
    default: null,
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
  // Calificaciones oficiales por fase (Kihon, Kata, Kumite)
  phaseScores: {
    kihon: { type: Number, default: 0 },
    kata: { type: Number, default: 0 },
    kumite: { type: Number, default: 0 },
  },
  // Ajustes colegiados individuales aplicados por fase técnica con flechas (bono o penalización)
  phaseAdjustments: {
    kihon: { type: Number, default: 0 },
    kata: { type: Number, default: 0 },
    kumite: { type: Number, default: 0 },
  },
  // Promedio técnico objetivo de las estrellas (Kihon, Kata, Kumite)
  technicalPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  // Ajuste Marcial por Espíritu / Actitud (Bono o Penalización en %, ej: +5, -10)
  martialAdjustment: {
    type: Number,
    default: 0,
    min: -50,
    max: 50,
  },
  // Justificación obligatoria del ajuste marcial
  martialAdjustmentReason: {
    type: String,
    default: '',
    trim: true,
  },
  // Porcentaje promediado final oficial (técnico + ajuste marcial)
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
  // Comentarios exclusivos del Sensei Roy Gatjens sobre el promedio final
  finalComments: {
    type: String,
    default: '',
    trim: true,
  },
  // Viñetas oficiales editadas, agregadas o quitadas por Dirección Técnica (Shihan Roy) por fase
  customPhaseBullets: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
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
