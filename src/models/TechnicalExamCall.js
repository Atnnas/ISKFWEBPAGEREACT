import mongoose from 'mongoose';

const TechnicalExamCallSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Convocatoria Oficial de Examen Técnico ISKF',
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
  dojoSensei: {
    type: String,
    default: '',
    trim: true,
  },
  examDate: {
    type: String,
    required: true,
    trim: true,
  },
  startTime: {
    type: String,
    default: '09:00 AM',
    trim: true,
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  // Token / Clave de acceso único para que el Sensei del dojo acceda a inscribir y promocionar
  accessToken: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['convocado', 'programado', 'en_tatami', 'cerrado'],
    default: 'convocado',
  },
  // Temarios aplicables
  syllabusIds: [{
    type: String,
    trim: true,
  }],
  // Snapshot inmutable de los temarios vigentes al momento de la convocatoria
  syllabusSnapshots: [{
    syllabusId: { type: String, trim: true },
    targetRank: { type: String, trim: true },
    name: { type: String, trim: true },
    techniques: { type: [mongoose.Schema.Types.Mixed], default: [] },
    technicalAspects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    version: { type: Number, default: 1 }
  }],
  // Aspirantes que conforman el Padrón Oficial para esta convocatoria
  aspirants: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: { type: String, trim: true },
    currentRank: { type: String, trim: true },
    targetRank: { type: String, trim: true },
    scheduleBlock: { type: String, trim: true, default: '' },
    promotedAt: { type: Date, default: Date.now },
  }],
  // Tribunal Evaluador convocado (mínimo 1, máximo 5)
  evaluators: [{
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    role: { type: String, trim: true, default: 'Sinodal' },
    token: { type: String, trim: true },
  }],
  // Bloques de horarios programados para atención de aspirantes (Tandas)
  schedules: [{
    blockName: { type: String, trim: true }, // ej: "Tanda 1"
    startTime: { type: String, trim: true }, // ej: "09:00 AM"
    endTime: { type: String, trim: true },   // ej: "09:45 AM"
    targetRanks: [{ type: String, trim: true }],
    studentIds: [{ type: String, trim: true }],
  }],
  // Cantidad máxima de karatecas configurada por tanda (configurable al crear convocatoria)
  maxPerTanda: {
    type: Number,
    default: 6,
    min: 1,
    max: 50,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  createdBy: {
    type: String,
    default: 'Comisión Técnica ISKF',
    trim: true,
  },
  closedAt: {
    type: Date,
    default: null,
  },
  closedForced: {
    type: Boolean,
    default: false,
  },
  reopenedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
  collection: 'TechnicalExamCalls'
});

TechnicalExamCallSchema.index({ dojoId: 1, status: 1 });
TechnicalExamCallSchema.index({ accessToken: 1 });

const TechnicalExamCall = mongoose.models.TechnicalExamCall || mongoose.model('TechnicalExamCall', TechnicalExamCallSchema);

export default TechnicalExamCall;
