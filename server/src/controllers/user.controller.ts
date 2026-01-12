import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { bucket } from '../config/firebaseAdmin.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ensureValidUserId = (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user id');
    }
};

export const addUser = asyncHandler(async (req, res) => {
    const { uid, displayName, email } = req.body;
    if (!uid || !displayName || !email) {
        throw new ApiError(400, 'uid, displayName, and email are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ uid }, { email }] });
    if (existingUser) {
        console.log('User already exists:', existingUser);
        // Return the existing user instead of throwing an error
        res.status(200).json(existingUser);
        return;
    }

    const user = await User.create({
        uid,
        displayName,
        email,
        bio: 'This user has not set a bio yet.',
        recentStories: [],
        editedStories: []
    });
    res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params as { id?: string };
    if (!id) {
        throw new ApiError(400, 'User id is required');
    }
    ensureValidUserId(id);

    const updates: Partial<Pick<typeof req.body, 'displayName' | 'bio'>> = {};
    if (typeof req.body.displayName === 'string') {
        const trimmed = req.body.displayName.trim();
        if (!trimmed) {
            throw new ApiError(400, 'Display name cannot be empty');
        }
        updates.displayName = trimmed;
    }
    if (typeof req.body.bio === 'string') {
        updates.bio = req.body.bio.trim();
    }

    if (Object.keys(updates).length === 0) {
        const existing = await User.findById(id);
        if (!existing) {
            throw new ApiError(404, 'User not found');
        }
        res.status(200).json(existing);
        return;
    }

    const user = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.status(200).json(user);
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.status(200).json(user);
});

export const getUserByUid = asyncHandler(async (req, res) => {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.status(200).json(user);
});

export const uploadAvatar = asyncHandler(async (req, res) => {
    const { id } = req.params as { id?: string };
    if (!id) {
        throw new ApiError(400, 'User id is required');
    }
    ensureValidUserId(id);
    const file = req.file;

    if (!file) {
        throw new ApiError(400, 'No file uploaded.');
    }

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const blob = bucket.file(`avatars/${id}/${uuidv4()}-${file.originalname}`);

    try {
        await blob.save(file.buffer, {
            metadata: { contentType: file.mimetype },
        });
        await blob.makePublic(); // Make the file publicly accessible
    } catch (error) {
        console.error('Avatar upload failed:', error);
        throw new ApiError(
            500,
            `Error uploading file: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }

    const publicUrl = blob.publicUrl(); // Get the public URL

    user.avatarImage = publicUrl;
    await user.save();

    res.status(200).json({
        message: 'File uploaded successfully.',
        avatarUrl: publicUrl,
        user,
    });
});
