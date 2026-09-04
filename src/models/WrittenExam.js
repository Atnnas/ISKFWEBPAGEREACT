import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['single_choice', 'short_answer', 'long_answer', 'matching'], 
    required: true 
  },
  text: { 
    type: String, 
    required: true, 
    trim: true 
  },
  imageUrl: {
    type: String,
    default: ''
  },
  options: [{ 
    type: String, 
    trim: true 
  }],
  correctOptionIndex: { 
    type: Number, 
    default: 0 
  },
  // Para preguntas de Asociar Términos (Eje Izquierdo vs Eje Superior)
  leftTerms: [{
    type: String,
    trim: true
  }],
  topTerms: [{
    type: String,
    trim: true
  }],
  correctMatches: [{
    leftIndex: { type: Number, default: 0 },
    rightIndex: { type: Number, default: 0 }
  }],
  expectedNotes: { 
    type: String, 
    trim: true,
    default: ''
  }
}, { _id: false });

const WrittenExamSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  code: { 
    type: String, 
    trim: true 
  },
  targetRanks: { 
    type: String, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true,
    default: '' 
  },
  questions: [QuestionSchema],
  order: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true,
  collection: 'WrittenExams'
});

const WrittenExam = mongoose.models.WrittenExam || mongoose.model('WrittenExam', WrittenExamSchema);

export default WrittenExam;
