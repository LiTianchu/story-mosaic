import { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface ReadSessionAttributes {
  userId: string;
  storyVersionId: Types.ObjectId | string;
  currentNodeId: Types.ObjectId | string;
  history: Array<Types.ObjectId | string>;
}

export interface ReadSessionDocument extends Document<unknown, unknown, ReadSessionAttributes>, ReadSessionAttributes {
    createdAt: Date;
    updatedAt: Date;
}

const readSessionSchema = new Schema<ReadSessionDocument>(
  {
    userId: { type: String, required: true },
    storyVersionId: { type: Schema.Types.ObjectId, ref: 'StoryVersion', required: true },
    currentNodeId: { type: Schema.Types.ObjectId, ref: 'StoryNode', required: true },
    history: [{ type: Schema.Types.ObjectId, ref: 'StoryNode' }],
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'readSessions', // Explicitly specify the collection name
  }
);

readSessionSchema.index({ userId: 1, storyVersionId: 1 }, { unique: true });

export const ReadSession: Model<ReadSessionDocument> = model<ReadSessionDocument>('ReadSession', readSessionSchema);
