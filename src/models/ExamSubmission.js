import mongoose from 'mongoose';

const StudentAnswerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['single_choice', 'short_answer', 'long_answer', 'matching'],
    required: true
  },
  questionText: {
    type: String,
    default: ''
  },
  // Para selección única
  selectedOptionIndex: {
    type: Number,
    default: null
  },
  // Para respuesta corta y larga
  writtenAnswer: {
    type: String,
    default: ''
  },
  // Para asociar términos
  matchingMatches: [{
    leftIndex: { type: Number },
    rightIndex: { type: Number }
  }],
  // Calificación por ítem
  isCorrect: {
    type: Boolean,
    default: null
  },
  earnedPoints: {
    type: Number,
    default: 0
  },
  maxPoints: {
    type: Number,
    default: 1
  },
  senseiComments: {
    type: String,
    default: ''
  }
}, { _id: false });

const ExamSubmissionSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExaminationSession',
    required: true
  },
  sessionTitle: {
    type: String,
    default: ''
  },
  writtenExamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WrittenExam',
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  studentDojo: {
    type: String,
    required: true,
    trim: true
  },
  studentRank: {
    type: String,
    trim: true,
    default: ''
  },
  answers: [StudentAnswerSchema],
  autoScore: {
    type: Number,
    default: 0
  },
  manualScore: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 100
  },
  percentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['submitted', 'graded'],
    default: 'submitted'
  },
  passed: {
    type: Boolean,
    default: null
  },
  senseiFeedback: {
    type: String,
    trim: true,
    default: ''
  },
  gradedBy: {
    type: String,
    trim: true,
    default: ''
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  },
  isAutoSubmitted: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'ExamSubmissions'
});

const ExamSubmission = mongoose.models.ExamSubmission || mongoose.model('ExamSubmission', ExamSubmissionSchema);

export default ExamSubmission;
