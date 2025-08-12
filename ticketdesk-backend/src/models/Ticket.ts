import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  title: string;
  description: string;
  department: string;
  institute: string;
  location: string;
  roomNumber: string;
  imageUrl?: string;
  submittedBy: mongoose.Schema.Types.ObjectId;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  submissionDate: Date;
  updates: {
    message: string;
    status?: 'pending' | 'in-progress' | 'resolved';
    priority?: 'low' | 'medium' | 'high';
    timestamp: Date;
    updatedBy: mongoose.Schema.Types.ObjectId;
  }[];
}

const TicketSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, required: true },
  institute: { type: String, required: true },
  location: { type: String, required: true },
  roomNumber: { type: String, required: true },
  imageUrl: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  submissionDate: { type: Date, default: Date.now },
  updates: [{
    message: { type: String },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'] },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
});

export default mongoose.model<ITicket>('Ticket', TicketSchema);