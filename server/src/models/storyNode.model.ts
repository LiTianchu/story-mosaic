import {Schema, model, type Document, type Model, Types} from 'mongoose';

export type StoryNodeType = 'paragraph' | 'option';

// StoryNode data to be sent to the frontend, matching the StoryNode interface in client/src/types/data.ts
export interface StoryNodeSerialized {
    _id: string;
    storyId: string;
    versionId: string;
    type: StoryNodeType;
    parentNodeIds: string[]; // a node can be reached from multiple predecessors
    targetNodeIds: string[]; // nodes this node connects to (outgoing edges)
    positionOnFlowchart: { x: number; y: number };
    activeContributors: string[];
    chapterTitle: string | null; // for paragraph nodes, the chapter title
    content: { text: string };
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
}

interface FlowPosition {
    x: number;
    y: number;
}

interface NodeContent {
    text: string;
}

export interface StoryNodeAttributes {
    storyId: Types.ObjectId | string;
    versionId?: string | null;
    type: StoryNodeType;
    parentNodeIds: Array<Types.ObjectId | string>;
    targetNodeIds: Array<Types.ObjectId | string>;
    positionOnFlowchart?: FlowPosition;
    activeContributors: string[];
    chapterTitle?: string | null;
    content: NodeContent;
    createdBy: string;
    updatedBy: string;
}

export interface StoryNodeDocument extends Document<unknown, unknown, StoryNodeAttributes>, StoryNodeAttributes {
    createdAt: Date;
    updatedAt: Date;
}

const flowPositionSchema = new Schema<FlowPosition>(
    {
        x: {type: Number, required: true, default: 0},
        y: {type: Number, required: true, default: 0},
    },
    {_id: false}
);

const nodeContentSchema = new Schema<NodeContent>(
    {
        text: {type: String, required: true},
    },
    {_id: false}
);

const storyNodeSchema = new Schema<StoryNodeDocument>(
    {
        storyId: {type: Schema.Types.ObjectId, ref: 'Story', required: true},
        versionId: {type: String, default: null},
        type: {type: String, required: true, enum: ['paragraph', 'option']},
        parentNodeIds: {
            type: [{type: Schema.Types.ObjectId, ref: 'StoryNode'}],
            default: [],
        },
        targetNodeIds: {
            type: [{type: Schema.Types.ObjectId, ref: 'StoryNode'}],
            default: [],
        },
        positionOnFlowchart: {type: flowPositionSchema, default: () => ({x: 0, y: 0})},
        activeContributors: {type: [String], default: []},
        chapterTitle: {type: String, default: null},
        content: {type: nodeContentSchema, required: true},
        createdBy: {type: String, required: true},
        updatedBy: {type: String, required: true},
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'storyNodes', // Explicitly specify the collection name
    }
);

export const StoryNode: Model<StoryNodeDocument> = model<StoryNodeDocument>('StoryNode', storyNodeSchema);
