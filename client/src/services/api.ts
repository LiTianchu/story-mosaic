import type {
  Story,
  StoryVersion,
  StoryNode,
  UserProfile,
  StoryDetail,
  StarActionResponse,
  Star,
} from "@app-types/data";

const inferDefaultApiUrl = () => {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:5001/api";
  }
  return "/api";
};

const RAW_BASE_URL = import.meta.env.VITE_API_URL ?? inferDefaultApiUrl();
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    // Let the browser set the Content-Type for FormData, which includes the boundary
    delete (headers as Record<string, string>)["Content-Type"];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new ApiError(
        response.status,
        errorData.error || errorData.message || "Request failed"
      );
    }

    const hasBody =
      response.status !== 204 &&
      response.status !== 205 &&
      response.headers.get("content-length") !== "0";
    const isJson =
      response.headers
        .get("content-type")
        ?.toLowerCase()
        .includes("application/json") ?? false;

    if (hasBody && isJson) {
      return (await response.json()) as T;
    }

    return undefined as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      error instanceof Error ? error.message : "Network error"
    );
  }
}

// Story API
export const storyApi = {
  getById: (storyId: string) => fetchApi<Story>(`/stories/${storyId}`),

  update: (storyId: string, data: Partial<Story>) =>
    fetchApi<Story>(`/stories/${storyId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadCover: (storyId: string, file: File) => {
    const formData = new FormData();
    formData.append("cover", file);

    return fetchApi<{ imageUrl?: string; coverUrl?: string }>(
      `/stories/${storyId}/cover`,
      {
        method: "PUT",
        body: formData,
      }
    );
  },

  create: (data: Partial<Story>) =>
    fetchApi<Story>("/stories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (storyId: string, userId: string) =>
    fetchApi<void>(`/stories/${storyId}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  list: () => fetchApi<Story[]>("/stories"),
};

// Story Version API
export const storyVersionApi = {
  getById: (versionId: string) =>
    fetchApi<StoryVersion>(`/story-versions/${versionId}`),

  getDraftVersionByStoryId: (storyId: string) =>
    // TODO: implement endpoint to get draft version
    fetchApi<StoryVersion>(`/story-versions/story/${storyId}/draft`),

  getByStoryId: (storyId: string) =>
    fetchApi<StoryVersion[]>(`/story-versions/story/${storyId}`),

  create: (data: Partial<StoryVersion>) =>
    fetchApi<StoryVersion>("/story-versions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (versionId: string, data: Partial<StoryVersion>) =>
    fetchApi<StoryVersion>(`/story-versions/${versionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  addNode: (versionId: string, nodeId: string) =>
    fetchApi<StoryVersion>(`/story-versions/${versionId}/add-node`, {
      method: "PATCH",
      body: JSON.stringify({ nodeId }),
    }),

  deleteNode: (versionId: string, nodeId: string) =>
    fetchApi<StoryVersion>(`/story-versions/${versionId}/delete-node`, {
      method: "PATCH",
      body: JSON.stringify({ nodeId }),
    }),

  clone: (versionId: string) =>
    fetchApi<StoryVersion>(`/story-versions/${versionId}/clone`, {
      method: "POST",
    }),

  incrementReadCount: (versionId: string) =>
    fetchApi<StoryVersion>(
      `/story-versions/${versionId}/increment-read-count`,
      {
        method: "PATCH",
      }
    ),
};

// Story Node API
export const storyNodeApi = {
  getById: (storyId: string, nodeId: string) =>
    fetchApi<StoryNode>(`/stories/${storyId}/nodes/${nodeId}`),

  list: (storyId: string, versionId?: string) => {
    const params = versionId ? `?versionId=${versionId}` : "";
    return fetchApi<StoryNode[]>(`/stories/${storyId}/nodes${params}`);
  },

  getTree: (versionId: string) => {
    return fetchApi<StoryNode[]>(`/story-nodes/tree?versionId=${versionId}`);
  },

  create: (storyId: string, data: Partial<StoryNode>) =>
    fetchApi<StoryNode>(`/stories/${storyId}/nodes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (storyId: string, nodeId: string, data: Partial<StoryNode>) =>
    fetchApi<StoryNode>(`/stories/${storyId}/nodes/${nodeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (storyId: string, nodeId: string) =>
    fetchApi<void>(`/stories/${storyId}/nodes/${nodeId}`, {
      method: "DELETE",
    }),

  updatePosition: (
    storyId: string,
    nodeId: string,
    position: { x: number; y: number },
    updatedBy: string
  ) =>
    fetchApi<StoryNode>(`/stories/${storyId}/nodes/${nodeId}/position`, {
      method: "PATCH",
      body: JSON.stringify({ positionOnFlowchart: position, updatedBy }),
    }),

  createConnection: (
    storyId: string,
    sourceNodeId: string,
    targetNodeId: string,
    updatedBy: string
  ) =>
    fetchApi<{ source: StoryNode; target: StoryNode }>(
      `/stories/${storyId}/nodes/connection`,
      {
        method: "POST",
        body: JSON.stringify({ sourceNodeId, targetNodeId, updatedBy }),
      }
    ),

  deleteConnection: (
    storyId: string,
    sourceId: string,
    targetId: string,
    updatedBy: string
  ) =>
    fetchApi<{ source: StoryNode; target: StoryNode }>(
      `/stories/${storyId}/nodes/connection`,
      {
        method: "DELETE",
        body: JSON.stringify({
          sourceNodeId: sourceId,
          targetNodeId: targetId,
          updatedBy,
        }),
      }
    ),

  addContributor: (storyId: string, nodeId: string, userId: string) =>
    fetchApi<StoryNode>(`/stories/${storyId}/nodes/${nodeId}/add-contributor`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  removeContributor: (storyId: string, nodeId: string, userId: string) =>
    fetchApi<StoryNode>(
      `/stories/${storyId}/nodes/${nodeId}/remove-contributor`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      }
    ),
};

// User Profile API
export const userApi = {
  getUserById: (userId: string) => fetchApi<UserProfile>(`/users/${userId}`),

  getUserByUid: (uid: string) => fetchApi<UserProfile>(`/users/uid/${uid}`),

  updateUser: (userId: string, data: Partial<UserProfile>) =>
    fetchApi<UserProfile>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadAvatar: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return fetchApi<{ avatarUrl: string; user?: UserProfile }>(
      `/users/${userId}/avatar`,
      {
        method: "PUT",
        body: formData,
      }
    );
  },
};

// Story Stats API
export const storyStatsApi = {
  getStarByStoryUserId: (storyId: string, userId: string) =>
    fetchApi<{ isStarred: boolean; star: Star }>(
      `/stories/${storyId}/star/user/${userId}`
    ),

  toggleStar: (storyId: string, userId: string) =>
    fetchApi<StarActionResponse>(`/stories/${storyId}/star/toggle-star`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  getReadCount: (storyId: string) => {
    return fetchApi<{ readCount: number }>(`/stories/${storyId}/read-count`);
  },
};

// Read Session API
export const readSessionApi = {
  get: (userId: string, storyVersionId: string) =>
    fetchApi<{
      userId: string;
      storyVersionId: string;
      currentNodeId: string;
      history: string[];
    } | null>(
      `/read-sessions?userId=${userId}&storyVersionId=${storyVersionId}`
    ),

  create: (userId: string, storyVersionId: string, currentNodeId: string) =>
    fetchApi<{
      userId: string;
      storyVersionId: string;
      currentNodeId: string;
      history: string[];
    }>("/read-sessions", {
      method: "POST",
      body: JSON.stringify({ userId, storyVersionId, currentNodeId }),
    }),

  update: (userId: string, storyVersionId: string, currentNodeId: string) =>
    fetchApi<{
      userId: string;
      storyVersionId: string;
      currentNodeId: string;
      history: string[];
    }>("/read-sessions", {
      method: "PUT",
      body: JSON.stringify({ userId, storyVersionId, currentNodeId }),
    }),
};

// User Stories API
export const userStoriesApi = {
  getMyStories: (ownerId: string) =>
    fetchApi<Story[]>(`/stories?ownerId=${ownerId}`),

  createStory: (data: Partial<Story>) =>
    fetchApi<Story>("/stories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteStory: (storyId: string, userId: string) =>
    fetchApi<void>(`/stories/${storyId}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),
};

// Story Detail API
export const storyDetailApi = {
  getById: (storyId: string) =>
    fetchApi<StoryDetail>(`/stories/${storyId}/detail`),
};
//
// Auth API - For syncing user data with backend
export const authApi = {
  // Create user profile (for new signups)
  createUserProfile: (
    userData: Pick<UserProfile, "uid" | "displayName" | "email">
  ) =>
    fetchApi<UserProfile>("/users/", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // Get user profile by Firebase UID
  getUserByUid: (uid: string) => fetchApi<UserProfile>(`/users/uid/${uid}`),
};

export { ApiError };
