import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  title: string;
  description: string;
  department: string;
  institute: string;
  location: string;
  roomNumber: string;
  imageUrl?: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  submissionDate: Date;
  updates: {
    message: string;
    timestamp: Date;
    updatedBy: {
      id: string;
      name: string;
      role: string;
    };
    status?: 'pending' | 'in-progress' | 'resolved';
    priority?: 'low' | 'medium' | 'high';
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
  submittedBy: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String }
  },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  submissionDate: { type: Date, default: Date.now },
  updates: [{
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true }
    },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved'] },
    priority: { type: String, enum: ['low', 'medium', 'high'] }
  }]
});

// Add virtual for id to match frontend expectations
TicketSchema.virtual('id').get(function(this: any) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
TicketSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    if (ret._id) delete ret._id;
    if (ret.__v) delete ret.__v;
    return ret;
  }
});

export default mongoose.model<ITicket>('Ticket', TicketSchema);