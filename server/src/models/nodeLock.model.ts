import { Schema, model, type Document, type Model, Types } from "mongoose";

// Not really used in the current implementation of locking but set up for future use
export interface NodeLockAttributes {
  storyVersionId: Types.ObjectId | string;
  nodeId: Types.ObjectId | string;
  lockedBy: string;
  lockedAt: Date;
}

export interface NodeLockDocument
  extends Document<unknown, unknown, NodeLockAttributes>,
    NodeLockAttributes {}

const nodeLockSchema = new Schema<NodeLockDocument>(
  {
    storyVersionId: {
      type: Schema.Types.ObjectId,
      ref: "StoryVersion",
      required: true,
    },
    nodeId: { type: Schema.Types.ObjectId, ref: "StoryNode", required: true },
    lockedBy: { type: String, required: true },
    lockedAt: { type: Date, default: Date.now, expires: "15m" }, // Auto-delete after 15 minutes
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "nodeLocks", // Explicitly specify the collection name
  }
);

nodeLockSchema.index({ storyVersionId: 1, nodeId: 1 }, { unique: true });

export const NodeLock: Model<NodeLockDocument> = model<NodeLockDocument>(
  "NodeLock",
  nodeLockSchema
);
