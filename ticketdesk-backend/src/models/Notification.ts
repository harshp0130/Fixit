import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  type: 'new_ticket' | 'ticket_assigned' | 'ticket_updated' | 'ticket_resolved';
  ticketId: mongoose.Schema.Types.ObjectId;
  recipientId: mongoose.Schema.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  metadata?: {
    department?: string;
    priority?: string;
    submittedBy?: string;
  };
}

const NotificationSchema: Schema = new Schema({
  type: { 
    type: String, 
    enum: ['new_ticket', 'ticket_assigned', 'ticket_updated', 'ticket_resolved'], 
    required: true 
  },
  ticketId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket', 
    required: true 
  },
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  readAt: { 
    type: Date 
  },
  metadata: {
    department: { type: String },
    priority: { type: String },
    submittedBy: { type: String }
  }
});

// Index for efficient querying
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
