import mongoose, { Schema, Model } from 'mongoose';
import { ITeam } from '../types/index.js';

const teamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  leader: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A team must have a leader']
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  capacity: {
    type: Number,
    default: 100 // 100% capacity default
  },
  performanceScore: {
    type: Number,
    default: 100
  },
  workloadPercentage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Team: Model<ITeam> = mongoose.model<ITeam>('Team', teamSchema);
export default Team;
