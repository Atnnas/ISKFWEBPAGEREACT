import mongoose from 'mongoose';

const ExaminationSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  writtenExamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WrittenExam',
    required: true
  },
  writtenExamName: {
    type: String,
    required: true,
    trim: true
  },
  assignedDojos: [{
    id: { type: String, trim: true },
    name: { type: String, trim: true },
    logo: { type: String, trim: true, default: '' }
  }],
  accessCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  timeLimitMinutes: {
    type: Number,
    default: 0
  },
  securityMode: {
    type: String,
    enum: ['audit', 'warnings', 'strict'],
    default: 'audit'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'ExaminationSessions'
});

const ExaminationSession = mongoose.models.ExaminationSession || mongoose.model('ExaminationSession', ExaminationSessionSchema);

export default ExaminationSession;
