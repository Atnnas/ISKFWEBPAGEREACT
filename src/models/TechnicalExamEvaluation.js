import mongoose from 'mongoose';

const TechnicalExamEvaluationSchema = new mongoose.Schema({
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
  // Map of technique and aspect scores: { [techniqueId]: { [rubricId]: score (1-5) } }
  scores: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Average for each technique / aspect
  techniqueAverages: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Observaciones específicas por técnica (según temario)
  observations: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Overall percentage grade (0 to 100)
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  pointsPossible: {
    type: Number,
    default: 0,
  },
  isPassed: {
    type: Boolean,
    default: false,
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  evaluatorName: {
    type: String,
    default: 'Comisión Técnica ISKF',
    trim: true,
  },
  evaluatorEmail: {
    type: String,
    default: '',
    trim: true,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  phaseNotes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  callId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechnicalExamCall',
    default: null,
  },
  evaluatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  collection: 'TechnicalExamEvaluations',
  strict: false
});

TechnicalExamEvaluationSchema.index({ dojoId: 1, studentId: 1 });
TechnicalExamEvaluationSchema.index({ studentId: 1, syllabusId: 1 });
TechnicalExamEvaluationSchema.index({ studentId: 1, evaluatorEmail: 1, syllabusId: 1 });
TechnicalExamEvaluationSchema.index({ callId: 1, evaluatorEmail: 1, studentId: 1 });
TechnicalExamEvaluationSchema.index({ callId: 1, studentId: 1 });

if (mongoose.models && mongoose.models.TechnicalExamEvaluation) {
  if (!mongoose.models.TechnicalExamEvaluation.schema?.paths?.callId) {
    delete mongoose.models.TechnicalExamEvaluation;
  }
}

const TechnicalExamEvaluation = mongoose.models.TechnicalExamEvaluation || mongoose.model('TechnicalExamEvaluation', TechnicalExamEvaluationSchema);

export default TechnicalExamEvaluation;
