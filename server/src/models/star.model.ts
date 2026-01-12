import { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface StarAttributes {
  userId: string;
  storyId: Types.ObjectId | string;
}

export interface StarDocument extends Document<unknown, unknown, StarAttributes>, StarAttributes {
  createdAt: Date;
  updatedAt: Date;
}

const starSchema = new Schema<StarDocument>(
  {
    userId: { type: String, required: true },
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'stars', // Explicitly specify the collection name
  }
);

starSchema.index({ userId: 1, storyId: 1 }, { unique: true });

export const Star: Model<StarDocument> = model<StarDocument>('Star', starSchema);
