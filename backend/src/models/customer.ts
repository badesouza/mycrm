import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  manager: {
    type: String,
    required: true
  },
  due_date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'cash'],
    default: 'credit_card'
  },
  imageLogo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Customer', customerSchema); 