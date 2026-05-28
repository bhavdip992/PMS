import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Credentials must be linked to a project'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Credential title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['Git', 'Hosting', 'Figma', 'API Key', 'Database', 'Other'],
      message: 'Type must be one of: Git, Hosting, Figma, API Key, Database, Other'
    },
    required: [true, 'Credential type is required']
  },
  details: {
    type: String, // Encrypted payload formatted as iv:encryptedData:tag
    required: [true, 'Credential details are required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Credentials must have a creator']
  }
}, {
  timestamps: true
});

const Credential = mongoose.model('Credential', credentialSchema);
export default Credential;
