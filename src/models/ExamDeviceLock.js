import mongoose from 'mongoose';

const ExamDeviceLockSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExaminationSession',
    required: true,
    index: true
  },
  deviceToken: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  fingerprint: {
    type: String,
    trim: true,
    index: true,
    default: ''
  },
  ip: {
    type: String,
    trim: true,
    default: ''
  },
  userAgent: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'locked_by_security', 'submitted', 'time_expired'],
    default: 'active',
    index: true
  },
  securityViolationsCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lockedAt: {
    type: Date
  },
  submittedAt: {
    type: Date
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  studentName: {
    type: String,
    trim: true,
    default: ''
  },
  studentDojo: {
    type: String,
    trim: true,
    default: ''
  },
  studentRank: {
    type: String,
    trim: true,
    default: ''
  },
  answeredQuestionsCount: {
    type: Number,
    default: 0
  },
  totalQuestionsCount: {
    type: Number,
    default: 0
  },
  lastPingAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'ExamDeviceLocks'
});

ExamDeviceLockSchema.index({ sessionId: 1, deviceToken: 1 }, { unique: true });
ExamDeviceLockSchema.index({ sessionId: 1, fingerprint: 1 });
ExamDeviceLockSchema.index({ sessionId: 1, ip: 1, userAgent: 1 });

const ExamDeviceLock = mongoose.models.ExamDeviceLock || mongoose.model('ExamDeviceLock', ExamDeviceLockSchema);

export default ExamDeviceLock;
