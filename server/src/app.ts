import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.js';
import { storyRouter } from './routes/story.routes.js';
import { storyNodeRouter } from './routes/storyNode.routes.js';
import storyVersionRoutes from './routes/storyVersion.routes.js';
import userRoutes from './routes/user.routes.js';
import nodeLockRoutes from './routes/nodeLock.routes.js';
import readSessionRoutes from './routes/readSession.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // Allow PATCH as well for partial updates and other common verbs
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Story Mosaic API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/stories', storyRouter);
app.use('/api/story-nodes', storyNodeRouter);
app.use('/api/story-versions', storyVersionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/node-locks', nodeLockRoutes);
app.use('/api/read-sessions', readSessionRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

app.use(errorHandler);

export default app;
