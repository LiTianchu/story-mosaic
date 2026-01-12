import { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface StoryVersionAttributes {
  storyId: Types.ObjectId | string;
  versionNumber: number;
  isPublished: boolean;
  nodeIds: Array<Types.ObjectId | string>;
  rootNodeId?: string | null;
  readCount: number;
  createdBy: string;
  updatedBy: string;
}

export interface StoryVersionDocument extends Document<unknown, unknown, StoryVersionAttributes>, StoryVersionAttributes {
  createdAt: Date;
  updatedAt: Date;
}

const storyVersionSchema = new Schema<StoryVersionDocument>(
  {
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
    versionNumber: { type: Number, required: true },
    isPublished: { type: Boolean, default: false },
    nodeIds: [{ type: Schema.Types.ObjectId, ref: 'StoryNode' }],
    rootNodeId: { type: String, default: null },
    readCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'storyVersions', // Explicitly specify the collection name
  }
);

export const StoryVersion: Model<StoryVersionDocument> = model<StoryVersionDocument>('StoryVersion', storyVersionSchema);
