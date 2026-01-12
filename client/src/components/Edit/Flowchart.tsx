import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from "@xyflow/react";
import type {
  Connection,
  OnConnect,
  Edge,
  OnEdgesChange,
  Node,
  OnNodesChange,
  FitViewOptions,
  DefaultEdgeOptions,
  EdgeTypes,
  NodeTypes,
  OnSelectionChangeFunc,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import ParagraphNode from "./ParagraphNode";
import OptionNode from "./OptionNode";
import NormalEdge from "./NormalEdge";
import Toolbar from "./Toolbar";
import ParagraphEditor from "./ParagraphEditor";
import OptionEditor from "./OptionEditor";
import Message from "@components/Common/Message";
import { animated, useSpring } from "@react-spring/web";
import type { StoryNode, StoryVersion } from "@app-types/data";
import { useUser } from "../../hooks/useUser";
import { useSocket } from "../../hooks/useSocket";
import { storyNodeApi } from "../../services/api";
import Loading from "@components/Common/Loading";

export type EditorNodeData = {
  storyNode: StoryNode;
  width: number;
  height: number;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  isRoot: boolean;
};

export type EditorEdgeData = {
  onDelete?: () => void;
  isActive?: boolean;
};

type FlowNode = Node<EditorNodeData>;
type FlowEdge = Edge<EditorEdgeData>;

type SelectionState = {
  type: "node" | "edge" | null;
  id: string | null;
};

const emptySelection: SelectionState = { type: null, id: null };

const createNodeSelection = (id: string | null): SelectionState =>
  id ? { type: "node", id } : emptySelection;

type NodeHandlers = {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const DEFAULT_NODE_WIDTH: { paragraph: number; option: number } = {
  paragraph: 288,
  option: 156,
};

const DEFAULT_NODE_HEIGHT: { paragraph: number; option: number } = {
  paragraph: 144,
  option: 96,
};

const nodeTypes: NodeTypes = {
  paragraph: ParagraphNode,
  option: OptionNode,
};

const edgeTypes: EdgeTypes = {
  normal: NormalEdge,
};

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

const proOptions = { hideAttribution: true };

const markerEnd = {
  type: MarkerType.ArrowClosed,
  color: "#8A907D",
} as const;

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
  type: "normal",
  markerEnd,
};

const cloneStoryNode = (node: StoryNode): StoryNode => ({
  ...node,
  parentNodeIds: [...node.parentNodeIds],
  targetNodeIds: [...node.targetNodeIds],
  positionOnFlowchart: node.positionOnFlowchart
    ? { ...node.positionOnFlowchart }
    : { x: 0, y: 0 },
  content: { ...node.content },
});

const createEdges = (storyNodes: StoryNode[]): FlowEdge[] =>
  storyNodes.flatMap((node) =>
    node.parentNodeIds.map((parentId) => ({
      id: `${parentId}-${node._id}`,
      source: parentId,
      target: node._id,
      type: "normal",
      markerEnd,
    }))
  );

const applySelectionToNodes = (
  nodes: FlowNode[],
  selection: SelectionState
): FlowNode[] =>
  nodes.map((node) => {
    const isSelected = selection.type === "node" && selection.id === node.id;
    if (node.data.isSelected === isSelected) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        isSelected,
      },
    };
  });

const mergeStoryNodeDataToFlow = (
  node: FlowNode,
  updatedStoryNode: StoryNode
): FlowNode => {
  const isRoot = node.data.isRoot;

  return {
    ...node,
    data: {
      ...node.data,
      storyNode: updatedStoryNode,
      isRoot,
    },
  };
};

// Main Flowchart component
function FlowchartInner({ storyVersion }: { storyVersion: StoryVersion }) {
  const { userProfile } = useUser();
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(true);
  const [nodeError, setNodeError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [centerPosition, setCenterPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [showOptionConnectWarning, setShowOptionConnectWarning] =
    useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] =
    useState<string>("Connection error");
  const [pendingDeletion, setPendingDeletion] = useState<{
    nodeId: string;
    nodeType: StoryNode["type"];
    nodeLabel: string;
  } | null>(null);

  const socket = useSocket();
  const reactFlowInstance = useReactFlow();

  const selectedNodeIdRef = useRef<string | null>(null);
  const editingNodeIdRef = useRef<string | null>(null);
  const activeSelectionRef = useRef<SelectionState>(emptySelection);
  const nodesRef = useRef<FlowNode[]>([]);
  const edgesRef = useRef<FlowEdge[]>([]);

  const [messageAnimProps, messageAnimApi] = useSpring(() => ({
    opacity: 1,
    config: { duration: 200 },
  }));

  const showConnectionError = useCallback(
    (message: string) => {
      setConnectionErrorMessage(message);
      setShowOptionConnectWarning(true);
      messageAnimApi.start({ from: { opacity: 0 }, to: { opacity: 1 } });
    },
    [messageAnimApi]
  );

  const addUserToNodeActiveContributors = useCallback(
    async (nodeId: string) => {
      if (userProfile) {
        console.log(
          `Adding user ${userProfile._id} to active contributors for node ${nodeId}`
        );
        await storyNodeApi.addContributor(
          storyVersion.storyId,
          nodeId,
          userProfile._id
        );
      }
    },
    [storyVersion.storyId, userProfile]
  );

  const removeUserFromNodeActiveContributors = useCallback(
    async (nodeId: string) => {
      if (userProfile) {
        console.log(
          `Removing user ${userProfile._id} from active contributors for node ${nodeId}`
        );
        await storyNodeApi.removeContributor(
          storyVersion.storyId,
          nodeId,
          userProfile._id
        );
      }
    },
    [storyVersion.storyId, userProfile]
  );

  const handleOpenEditor = useCallback(
    (nodeId: string) => {
      const targetNode = nodesRef.current.find((node) => node.id === nodeId);
      if (!targetNode) {
        console.warn("Target node not found:", nodeId);
        return;
      }
      if (targetNode.data.storyNode.activeContributors.length > 0) {
        alert("Cannot edit node when another author is editing.");
        return;
      }

      console.log("Opening editor for node:", nodeId);
      setSelectedNodeId(nodeId);
      setEditingNodeId(nodeId);
      setHasUnsavedChanges(true);
      addUserToNodeActiveContributors(nodeId);
    },
    [addUserToNodeActiveContributors]
  );

  useEffect(() => {
    // switch user activity when selected node changes
    console.log("Selected node changed:", selectedNodeId);
    selectedNodeIdRef.current = selectedNodeId;
  }, [
    addUserToNodeActiveContributors,
    removeUserFromNodeActiveContributors,
    selectedNodeId,
  ]);

  useEffect(() => {
    editingNodeIdRef.current = editingNodeId;
  }, [editingNodeId]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // handle the request to delete a node (shows confirmation dialog)
  const handleRequestDeleteNode = useCallback((nodeId: string) => {
    const targetNode = nodesRef.current.find((node) => node.id === nodeId);

    if (!targetNode) {
      return;
    }

    if (targetNode.data.storyNode.activeContributors.length > 0) {
      alert("Cannot delete node when another author is editing.");
      return;
    }

    if (targetNode.data.isRoot) {
      console.warn("The root node cannot be deleted.");
      return;
    }

    const storyNode = targetNode.data.storyNode;
    // determine node label for confirmation dialog
    const nodeLabel =
      storyNode.type === "paragraph"
        ? storyNode.chapterTitle?.trim().length
          ? storyNode.chapterTitle
          : "Untitled fragment"
        : storyNode.content.text?.trim().length
        ? storyNode.content.text
        : "Empty option";

    // set the active selection to the node being requested for deletion
    const nextSelection: SelectionState = { type: "node", id: nodeId };
    activeSelectionRef.current = nextSelection;
    setSelectedNodeId(nodeId);
    setNodes((current) => {
      const shouldUpdate = current.some(
        (node) => node.data.isSelected !== (node.id === nodeId)
      );

      if (!shouldUpdate) {
        return current;
      }

      return applySelectionToNodes(current, nextSelection);
    });

    // deactivate any active edges
    setEdges((current) =>
      current.map((edge) => {
        if (!edge.data?.isActive) {
          return edge;
        }

        return {
          ...edge,
          data: {
            ...edge.data,
            isActive: false,
          },
        };
      })
    );

    // set the pending deletion state to show confirmation dialog
    setPendingDeletion({
      nodeId,
      nodeType: storyNode.type,
      nodeLabel,
    });
  }, []);

  // node handlers passed to flow nodes
  const nodeHandlers = useMemo<NodeHandlers>(
    () => ({
      onEdit: handleOpenEditor,
      onDelete: handleRequestDeleteNode,
    }),
    [handleOpenEditor, handleRequestDeleteNode]
  );

  const closeEditor = useCallback(async () => {
    if (editingNodeIdRef.current) {
      console.log("Closing editor for node:", editingNodeIdRef.current);
      await removeUserFromNodeActiveContributors(editingNodeIdRef.current);
    }
    setEditingNodeId(null);
  }, [removeUserFromNodeActiveContributors]);

  // function to create flow nodes from story nodes
  const createFlowNode = useCallback(
    (
      storyNode: StoryNode,
      handlers: NodeHandlers,
      selection: SelectionState
    ) => {
      const clonedNode = cloneStoryNode(storyNode);
      const width = DEFAULT_NODE_WIDTH[clonedNode.type];
      const height = DEFAULT_NODE_HEIGHT[clonedNode.type];
      const isRoot = clonedNode._id === storyVersion.rootNodeId;
      const hasIncomingEdge = isRoot
        ? true
        : clonedNode.parentNodeIds.length > 0;
      const isSelected =
        selection.type === "node" && selection.id === clonedNode._id;

      return {
        id: clonedNode._id,
        type: clonedNode.type,
        position: clonedNode.positionOnFlowchart,
        data: {
          storyNode: clonedNode,
          width,
          height,
          onEdit: () => handlers.onEdit(clonedNode._id),
          onDelete: () => handlers.onDelete(clonedNode._id),
          isSelected,
          isRoot,
          hasIncomingEdge,
        },
      };
    },
    [storyVersion.rootNodeId]
  );

  const createFlowNodes = useCallback(
    (
      storyNodes: StoryNode[],
      handlers: NodeHandlers,
      selection: SelectionState
    ): FlowNode[] =>
      storyNodes.map((storyNode) => {
        return createFlowNode(storyNode, handlers, selection);
      }),
    [createFlowNode]
  );

  // Socket.IO event listeners for real-time collaboration
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNodeCreated = (newStoryNode: StoryNode) => {
      console.log("Socket event: node-created", newStoryNode);
      setNodes((nds) => {
        // Check if node already exists to avoid duplicates
        if (nds.some((n) => n.id === newStoryNode._id)) {
          return nds;
        }

        const newFlowNode = createFlowNode(
          newStoryNode,
          nodeHandlers,
          activeSelectionRef.current
        );

        return [...nds, newFlowNode];
      });
    };

    const handleNodeUpdated = (updatedStoryNode: StoryNode) => {
      console.log("Socket event: node-updated", updatedStoryNode);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === updatedStoryNode._id
            ? mergeStoryNodeDataToFlow(node, updatedStoryNode)
            : node
        )
      );
    };

    const handleNodeDeleted = ({ nodeId }: { nodeId: string }) => {
      console.log("Socket event: node-deleted", nodeId);
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    };

    const handleConnectionCreated = ({
      sourceNode,
      targetNode,
    }: {
      sourceNode: StoryNode;
      targetNode: StoryNode;
    }) => {
      console.log("Socket event: connection-created", sourceNode, targetNode);
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === sourceNode._id)
            return mergeStoryNodeDataToFlow(n, sourceNode);
          if (n.id === targetNode._id)
            return mergeStoryNodeDataToFlow(n, targetNode);
          return n;
        })
      );
      setEdges((eds) =>
        addEdge(
          {
            id: `${sourceNode._id}-${targetNode._id}`,
            source: sourceNode._id,
            target: targetNode._id,
            type: "normal",
            markerEnd,
          },
          eds
        )
      );
    };

    const handleConnectionDeleted = ({
      sourceNodeId,
      targetNodeId,
    }: {
      sourceNodeId: string;
      targetNodeId: string;
    }) => {
      console.log(
        "Socket event: connection-deleted",
        sourceNodeId,
        targetNodeId
      );
      // This is a simplified update. A more robust solution would fetch the updated nodes.
      setEdges((eds) =>
        eds.filter(
          (e) => !(e.source === sourceNodeId && e.target === targetNodeId)
        )
      );
      // We are not updating the parent/target arrays in the nodes here to avoid complexity.
      // The connection is visually removed, which is the most critical part for the user experience.
    };

    const handleNodePositionUpdated = (updatedStoryNode: StoryNode) => {
      console.log("Socket event: node-position-updated", updatedStoryNode);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === updatedStoryNode._id) {
            return {
              ...mergeStoryNodeDataToFlow(node, updatedStoryNode),
              position: updatedStoryNode.positionOnFlowchart,
            };
          }
          return node;
        })
      );
    };

    const handleUserJoinedNode = (data: {
      nodeId: string;
      userId: string;
      activeContributors: string[];
    }) => {
      console.log(
        "Socket event: user-joined-node",
        data.nodeId,
        data.userId,
        data.activeContributors
      );
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === data.nodeId) {
            const updatedStoryNode = {
              ...node.data.storyNode,
              activeContributors: data.activeContributors,
            };
            return mergeStoryNodeDataToFlow(node, updatedStoryNode);
          }
          return node;
        })
      );
    };

    const handleUserLeftNode = (data: {
      nodeId: string;
      userId: string;
      activeContributors: string[];
    }) => {
      console.log(
        "Socket event: user-left-node",
        data.nodeId,
        data.userId,
        data.activeContributors
      );
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === data.nodeId) {
            const updatedStoryNode = {
              ...node.data.storyNode,
              activeContributors: data.activeContributors,
            };

            return mergeStoryNodeDataToFlow(node, updatedStoryNode);
          }
          return node;
        })
      );
    };

    socket.on("node-created", handleNodeCreated);
    socket.on("node-updated", handleNodeUpdated);
    socket.on("node-deleted", handleNodeDeleted);
    socket.on("connection-created", handleConnectionCreated);
    socket.on("connection-deleted", handleConnectionDeleted);
    socket.on("node-position-updated", handleNodePositionUpdated);
    socket.on("user-joined-node", handleUserJoinedNode);
    socket.on("user-left-node", handleUserLeftNode);

    return () => {
      socket.off("node-created", handleNodeCreated);
      socket.off("node-updated", handleNodeUpdated);
      socket.off("node-deleted", handleNodeDeleted);
      socket.off("connection-created", handleConnectionCreated);
      socket.off("connection-deleted", handleConnectionDeleted);
      socket.off("node-position-updated", handleNodePositionUpdated);
      socket.off("user-joined-node", handleUserJoinedNode);
      socket.off("user-left-node", handleUserLeftNode);
    };
  }, [
    handleOpenEditor,
    createFlowNode,
    socket,
    storyVersion.rootNodeId,
    nodeHandlers,
  ]);

  // handler to remove a connection (edge) between two nodes
  const handleRemoveConnection = useCallback(
    async (sourceNodeId: string, targetNodeId: string | null) => {
      if (!targetNodeId) {
        return;
      }

      try {
        if (!userProfile) {
          throw new Error("User not authenticated");
        }
        // Call API to delete the connection
        await storyNodeApi.deleteConnection(
          storyVersion.storyId,
          sourceNodeId,
          targetNodeId,
          userProfile._id
        );

        // UI update will be handled by the socket event 'connection-deleted'
        // setEdges((eds) => eds.filter((edge) => !(edge.source === sourceNodeId && edge.target === targetNodeId)));
      } catch (error) {
        console.error("Failed to delete connection:", error);
      }
    },
    [storyVersion.storyId, userProfile]
  );

  // ensure every edge carries a delete handler so custom UI can remove it without confirmation
  const enhanceEdges = useCallback(
    (
      incoming: FlowEdge[],
      activeEdgeId: string | null = activeSelectionRef.current.type === "edge"
        ? activeSelectionRef.current.id
        : null
    ): FlowEdge[] =>
      incoming.map((edge) => {
        const sourceId = edge.source;
        const targetId = edge.target;

        let nextEdge = edge;
        let nextData = edge.data;
        let updated = false;

        if (sourceId && targetId && !edge.data?.onDelete) {
          nextData = {
            ...edge.data,
            onDelete: () => handleRemoveConnection(sourceId, targetId),
          };
          updated = true;
        }

        const isActive = activeEdgeId === edge.id;
        if ((edge.data?.isActive ?? false) !== isActive) {
          nextData = {
            ...(nextData ?? edge.data),
            isActive,
          };
          updated = true;
        }

        if (updated) {
          nextEdge = {
            ...edge,
            data: nextData,
          };
        }

        return nextEdge;
      }),
    [handleRemoveConnection]
  );

  // React flow event handler for event: onNodesChange
  const handleNodesChange: OnNodesChange<FlowNode> = useCallback(
    (changes) =>
      setNodes((nds) => applyNodeChanges(changes, nds) as FlowNode[]),
    []
  );

  // React flow event handler for event: onEdgesChange
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        return enhanceEdges(applyEdgeChanges(changes, eds) as FlowEdge[]);
      });
    },
    [enhanceEdges]
  );

  // React flow event handler for event: onSelectionChange
  const handleSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: selectedNodes = [], edges: selectedEdges = [] }) => {
      let nextSelection: SelectionState = emptySelection;

      if (selectedEdges.length) {
        nextSelection = { type: "edge", id: selectedEdges[0].id };
      } else if (selectedNodes.length) {
        nextSelection = { type: "node", id: selectedNodes[0].id };
      }

      activeSelectionRef.current = nextSelection;

      // console.log("Selection changed:", nextSelection);
      setSelectedNodeId(
        nextSelection.type === "node" ? nextSelection.id : null
      );
      setNodes((current) => applySelectionToNodes(current, nextSelection));

      if (nextSelection.type !== "edge") {
        setEdges((current) =>
          current.map((edge) => {
            if (!edge.data?.isActive) {
              return edge;
            }

            return {
              ...edge,
              data: {
                ...edge.data,
                isActive: false,
              },
            };
          })
        );
      } else {
        setEdges((current) => enhanceEdges(current, nextSelection.id));
      }
    },
    [enhanceEdges]
  );

  // React flow event handler for event: onEdgesDelete
  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      const connections = deletedEdges
        .filter((edge) => Boolean(edge.source && edge.target))
        .map((edge) => ({
          source: edge.source as string,
          target: edge.target as string,
        }));

      if (!connections.length) {
        return;
      }

      setEdges((eds) =>
        enhanceEdges(
          eds.filter(
            (edge) =>
              !connections.some(
                (conn) =>
                  edge.source === conn.source && edge.target === conn.target
              )
          )
        )
      );
    },
    [enhanceEdges]
  );

  const createsCycle = useCallback(
    (
      sourceId: string,
      targetId: string,
      nodeMap: Map<string, FlowNode>,
      visited = new Set<string>()
    ): boolean => {
      if (sourceId === targetId) return true;
      if (visited.has(targetId)) return false;
      visited.add(targetId);

      const targetNode = nodeMap.get(targetId);
      if (!targetNode) return false;

      const childIds = targetNode.data.storyNode.targetNodeIds ?? [];

      for (const childId of childIds) {
        if (createsCycle(sourceId, childId, nodeMap, visited)) {
          return true;
        }
      }

      return false;
    },
    []
  );

  // checks if a connection between two nodes is allowed
  const isConnectionAllowed = useCallback(
    (edgeOrConnection: Connection | FlowEdge): boolean => {
      const source = edgeOrConnection.source ?? null;
      const target = edgeOrConnection.target ?? null;

      // if node either is undefined or null, disallow
      if (!source || !target) {
        return false;
      }

      // get source and target nodes
      const sourceNode = nodesRef.current.find((node) => node.id === source);
      const targetNode = nodesRef.current.find((node) => node.id === target);

      // if either node is not found, disallow
      if (!sourceNode || !targetNode) {
        return false;
      }

      // get actual node data in the database
      const sourceStoryNode = sourceNode.data.storyNode;
      const targetStoryNode = targetNode.data.storyNode;

      // Constraint enforcements
      // Constraint 1: disallow connecting two nodes of the same type
      if (sourceStoryNode.type === targetStoryNode.type) {
        showConnectionError("Cannot connect two nodes of the same type");
        return false;
      }

      // Constraint 2: options can only connect to one fragment
      if (
        sourceStoryNode.type === "option" &&
        sourceStoryNode.targetNodeIds.length > 0 &&
        sourceStoryNode.targetNodeIds[0] !== targetStoryNode._id
      ) {
        showConnectionError("An option can only connect to one fragment");
        return false;
      }

      // Constraint 3: disallow duplicate connections
      const currentEdgeId =
        typeof (edgeOrConnection as FlowEdge).id === "string"
          ? (edgeOrConnection as FlowEdge).id
          : null;
      const duplicateExists = edgesRef.current.some(
        (edge) =>
          edge.source === source &&
          edge.target === target &&
          edge.id !== currentEdgeId
      );

      if (duplicateExists) {
        showConnectionError("These nodes are already connected");
        return false;
      }

      // Constraint 4: disallow any node to connect to the root node
      if (targetNode.data.isRoot) {
        showConnectionError("Root node cannot have incoming connections");
        return false;
      }

      const nodeMap = new Map(nodesRef.current.map((n) => [n.id, n]));
      // Constraint 5: disallow creating cycles in the graph
      if (createsCycle(source, target, nodeMap)) {
        showConnectionError("Cannot create cyclic connections");
        return false;
      }

      return true;
    },
    [createsCycle, showConnectionError]
  );

  // React flow event handler for event: onNodeDragStop
  const handleNodeDragStop = useCallback(
    (_: unknown, node: FlowNode) => {
      // Optimistically update the node's position in the UI
      setNodes((nds) =>
        nds.map((current) =>
          current.id === node.id
            ? { ...current, position: node.position }
            : current
        )
      );

      if (!userProfile) {
        console.error("User not authenticated");
        return;
      }

      // Persist position to backend asynchronously
      storyNodeApi
        .updatePosition(
          storyVersion.storyId,
          node.id,
          node.position,
          userProfile._id
        )
        .catch((error) => {
          console.error("Failed to update node position:", error);
          // Here you could add logic to revert the position if the API call fails
        });
    },
    [storyVersion.storyId, userProfile]
  );

  // React flow event handler for event: onConnect
  const handleConnect: OnConnect = useCallback(
    async (params: Connection) => {
      if (!isConnectionAllowed(params) || !params.source || !params.target) {
        return;
      }

      if (!userProfile) {
        console.error("User not authenticated");
        return;
      }

      try {
        // Call API to create the connection
        await storyNodeApi.createConnection(
          storyVersion.storyId,
          params.source,
          params.target,
          userProfile.uid
        );
        // UI update will be handled by the socket event 'connection-created'
      } catch (error) {
        console.error("Failed to create connection:", error);
      }
    },
    [isConnectionAllowed, storyVersion.storyId, userProfile]
  );

  const updateCenterPosition = useCallback(() => {
    const screenPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const { x, y } = reactFlowInstance.screenToFlowPosition(screenPoint);
    setCenterPosition({ x, y });
  }, [reactFlowInstance]);

  // React float event handler for event: onMove
  const handleMove = useCallback(() => {
    updateCenterPosition();
  }, [updateCenterPosition]);

  // ==========Custom event handlers for flowchart==========

  // ==========Node update handlers==========
  // handles updating paragraph node content
  const handleUpdateParagraph = useCallback(
    (nodeId: string, payload: { chapterTitle: string; text: string }) => {
      const trimmedTitle = payload.chapterTitle.trim();
      if (!userProfile) {
        console.error("User not authenticated");
        return;
      }
      const updates: Partial<StoryNode> = {
        chapterTitle: trimmedTitle.length ? trimmedTitle : "Untitled fragment",
        content: { text: payload.text },
        updatedBy: userProfile._id,
      };

      // Optimistically update UI
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          const updatedStoryNode: StoryNode = {
            ...node.data.storyNode,
            ...updates,
            updatedAt: new Date(),
          };
          return mergeStoryNodeDataToFlow(node, updatedStoryNode);
        })
      );

      // Persist to backend asynchronously
      storyNodeApi
        .update(storyVersion.storyId, nodeId, updates)
        .catch((error) => {
          console.error("Failed to update paragraph node:", error);
          // Optional: Revert optimistic update on failure
        });
    },
    [storyVersion.storyId, userProfile]
  );

  const handleUpdateOption = useCallback(
    (nodeId: string, payload: { text: string }) => {
      const trimmedText = payload.text.trim();
      if (!userProfile) {
        console.error("User not authenticated");
        return;
      }
      const updates: Partial<StoryNode> = {
        content: { text: trimmedText.length ? trimmedText : "Empty option" },
        updatedBy: userProfile._id,
      };

      // Optimistically update UI
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          const updatedStoryNode: StoryNode = {
            ...node.data.storyNode,
            ...updates,
            updatedAt: new Date(),
          };
          return mergeStoryNodeDataToFlow(node, updatedStoryNode);
        })
      );

      // Persist to backend asynchronously
      storyNodeApi
        .update(storyVersion.storyId, nodeId, updates)
        .catch((error) => {
          console.error("Failed to update option node:", error);
          // Optional: Revert optimistic update on failure
        });
    },
    [storyVersion.storyId, userProfile]
  );

  // ===========End of Node update handlers===========

  // =========Node deletion handlers==========
  // delete confirmation handler
  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeletion) {
      return;
    }

    try {
      // Delete from backend
      await storyNodeApi.delete(storyVersion.storyId, pendingDeletion.nodeId);

      // UI update will be handled by the socket event 'node-deleted'
      setPendingDeletion(null);
    } catch (error) {
      console.error("Failed to delete node:", error);
      // Could show error message to user here
      setPendingDeletion(null);
    }
  }, [pendingDeletion, storyVersion.storyId]);

  // delete cancellation handler
  const handleCancelDelete = useCallback(() => {
    setPendingDeletion(null);
  }, []);

  // key event handler for deleting nodes or edges using Delete/Backspace keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete") {
        return;
      }

      // if a deletion is already pending, ignore further delete requests
      if (pendingDeletion) {
        event.preventDefault();
        return;
      }

      if (editingNodeId) {
        // exlude input elements to allow normal text editing behavior
        const target = event.target as HTMLElement;
        const isInputElement =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        if (isInputElement) {
          return; // allow normal behavior in input fields
        }
        event.preventDefault();
        return;
      }

      const selectedEdges = reactFlowInstance
        .getEdges()
        .filter((edge) => edge.selected && edge.source && edge.target);

      // handle edge deletion if any edges are selected
      if (selectedEdges.length) {
        event.preventDefault();
        selectedEdges.forEach((edge) =>
          handleRemoveConnection(edge.source as string, edge.target as string)
        );
        return;
      }

      // handle node deletion if a node is selected
      if (selectedNodeId) {
        event.preventDefault();
        handleRequestDeleteNode(selectedNodeId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingNodeId,
    handleRemoveConnection,
    handleRequestDeleteNode,
    pendingDeletion,
    reactFlowInstance,
    selectedNodeId,
  ]);

  // handle escape key to cancel deletion
  useEffect(() => {
    if (!pendingDeletion) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCancelDelete();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleCancelDelete, pendingDeletion]);

  // ================End of Node deletion handlers==========

  // ==========Node addition handlers==========

  // add new paragraph node at center position
  const handleAddParagraph = useCallback(async () => {
    if (!userProfile) {
      console.error("User not authenticated");
      return;
    }

    const width = DEFAULT_NODE_WIDTH.paragraph;
    const position = { x: centerPosition.x - width / 2, y: centerPosition.y };

    try {
      // The API call will trigger a 'node-created' socket event,
      // which will then add the node to the canvas for all clients.
      await storyNodeApi.create(storyVersion.storyId, {
        versionId: storyVersion._id,
        type: "paragraph",
        parentNodeIds: [],
        targetNodeIds: [],
        positionOnFlowchart: position,
        chapterTitle: "Untitled fragment",
        content: { text: "Empty fragment content" },
        createdBy: userProfile._id,
      });
    } catch (error) {
      console.error("Failed to create paragraph node:", error);
    }
  }, [centerPosition, storyVersion._id, storyVersion.storyId, userProfile]);

  // add new option node at center position
  const handleAddOption = useCallback(async () => {
    if (!userProfile) {
      console.error("User not authenticated");
      return;
    }
    const width = DEFAULT_NODE_WIDTH.option;
    const position = { x: centerPosition.x - width / 2, y: centerPosition.y };

    try {
      // The API call will trigger a 'node-created' socket event,
      // which will then add the node to the canvas for all clients.
      await storyNodeApi.create(storyVersion.storyId, {
        versionId: storyVersion._id,
        type: "option",
        parentNodeIds: [],
        targetNodeIds: [],
        positionOnFlowchart: position,
        chapterTitle: null,
        content: { text: "Empty option" },
        createdBy: userProfile._id,
      });
    } catch (error) {
      console.error("Failed to create option node:", error);
    }
  }, [centerPosition, storyVersion._id, storyVersion.storyId, userProfile]);

  // ==========End of Node addition handlers==========

  // Flowchart initialization
  // initialize flow nodes and edges when story version changes
  useEffect(() => {
    const loadStoryNodes = async () => {
      if (!storyVersion) return;

      try {
        setIsLoadingNodes(true);
        setNodeError(null);
        console.log("Loading nodes for story version: ", storyVersion._id);
        const storyNodes = await storyNodeApi.list(
          storyVersion.storyId,
          storyVersion._id
        );

        if (storyNodes.length === 0) {
          console.warn("No nodes found for this story version.");
        }

        const initialSelectedId = storyNodes[0]?._id ?? null;
        const initialSelection = createNodeSelection(initialSelectedId);
        const initialNodes = createFlowNodes(
          storyNodes,
          nodeHandlers,
          initialSelection
        );

        setNodes(applySelectionToNodes(initialNodes, initialSelection));
        setEdges(
          enhanceEdges(
            createEdges(storyNodes),
            initialSelection.type === "edge" ? initialSelection.id : null
          )
        );
        activeSelectionRef.current = initialSelection;
        setSelectedNodeId(
          initialSelection.type === "node" ? initialSelection.id : null
        );
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to load story nodes:", error);
        setNodeError(
          error instanceof Error ? error.message : "Failed to load nodes"
        );
      } finally {
        setIsLoadingNodes(false);
      }
    };
    loadStoryNodes();
  }, [createFlowNodes, enhanceEdges, nodeHandlers, storyVersion]);

  // update center position on mount and window resize
  useEffect(() => {
    updateCenterPosition();
    const handleResize = () => updateCenterPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCenterPosition]);

  // clear editing node if it has been deleted
  useEffect(() => {
    // check if the editing node still exists
    if (editingNodeId && !nodes.some((node) => node.id === editingNodeId)) {
      // if no longer exists, clear editing state
      setEditingNodeId(null);
    }
  }, [editingNodeId, nodes]);

  // warn user of unsaved changes before leaving the page, unsaved changes are defined as whether the edit modal is open
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // get the currently editing flow node
  const editingFlowNode = useMemo(
    () =>
      editingNodeId
        ? nodes.find((node) => node.id === editingNodeId)
        : undefined,
    [editingNodeId, nodes]
  );

  // variables for determining the editing node and its metadata
  const editingStoryNode = editingFlowNode?.data.storyNode;
  const editingNodeMetadata = editingFlowNode?.data;

  // =========Animation callbacks=========
  // animation for connection error message
  const closeOptionConnectWarning = useCallback(() => {
    messageAnimApi.start({
      from: { opacity: 1 },
      to: { opacity: 0 },
      reset: true,
      onRest: () => setShowOptionConnectWarning(false),
    });
  }, [messageAnimApi]);

  // =========End of Animation callbacks=========

  if (isLoadingNodes) {
    return <Loading />;
  }

  if (nodeError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-red-500">
          Error loading flowchart: {nodeError}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-paper">
      {/* React Flow  flow chart component*/}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onEdgesDelete={handleEdgesDelete}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        onSelectionChange={handleSelectionChange}
        onMove={handleMove}
        isValidConnection={isConnectionAllowed}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        proOptions={proOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={[]}
        edgesFocusable
        elementsSelectable
        className="h-full w-full"
      >
        <MiniMap />
        <Background />
        <Toolbar
          onAddParagraph={handleAddParagraph}
          onAddOption={handleAddOption}
        />
      </ReactFlow>

      {showOptionConnectWarning && (
        <animated.div
          style={messageAnimProps}
          className="pointer-events-none absolute left-1/2 top-20 z-1000 -translate-x-1/2"
        >
          <Message
            type="error"
            message={connectionErrorMessage}
            onClose={closeOptionConnectWarning}
            autoClose
          />
        </animated.div>
      )}

      {/* // paragraph editor modal */}
      {editingStoryNode?.type === "paragraph" && editingNodeMetadata && (
        <ParagraphEditor
          key={editingStoryNode._id}
          node={editingStoryNode}
          isRoot={editingNodeMetadata.isRoot}
          onSave={(payload: { chapterTitle: string; text: string }) =>
            handleUpdateParagraph(editingStoryNode._id, payload)
          }
          onClose={async (payload: { chapterTitle: string; text: string }) => {
            await closeEditor();
            handleUpdateParagraph(editingStoryNode._id, payload);
            setHasUnsavedChanges(false);
          }}
          onDelete={() => handleRequestDeleteNode(editingStoryNode._id)}
        />
      )}

      {/* option editor modal */}
      {editingStoryNode?.type === "option" && editingNodeMetadata && (
        <OptionEditor
          key={editingStoryNode._id}
          node={editingStoryNode}
          isRoot={editingNodeMetadata.isRoot}
          onSave={(payload: { text: string }) =>
            handleUpdateOption(editingStoryNode._id, payload)
          }
          onClose={async (payload: { text: string }) => {
            await closeEditor();
            handleUpdateOption(editingStoryNode._id, payload);
            setHasUnsavedChanges(false);
          }}
          onDelete={() => handleRequestDeleteNode(editingStoryNode._id)}
        />
      )}

      {/* delete confirmation modal */}
      {pendingDeletion && (
        <div
          className="fixed inset-0 z-550 flex items-center justify-center bg-dark-ink/40 px-4"
          role="alertdialog"
          aria-modal
          aria-labelledby="delete-node-dialog-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCancelDelete();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-paper shadow-2xl">
            <div className="border-b border-secondary-btn/60 px-6 py-4">
              <h2
                id="delete-node-dialog-title"
                className="text-lg font-semibold text-dark-ink"
              >
                Delete{" "}
                {pendingDeletion.nodeType === "paragraph"
                  ? "fragment"
                  : "option"}
              </h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-sm text-dark-ink">
              <p>
                Are you sure you want to remove
                <span className="ml-1 font-semibold text-dark-ink wrap-break-words whitespace-pre-wrap">
                  "{pendingDeletion.nodeLabel}"
                </span>
                ?
              </p>
              <p className="text-xs text-faint-ink">
                This will detach any linked connections and cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-secondary-btn/60 px-6 py-4">
              <button
                type="button"
                className="rounded-lg border border-secondary-btn px-4 py-2 text-sm font-medium text-dark-ink transition hover:bg-secondary-btn/10"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-light-ink transition hover:bg-danger/80"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper component to provide React Flow context
function Flowchart(props: { storyVersion: StoryVersion }) {
  // React Flow provider to manage state internally
  return (
    <ReactFlowProvider>
      <FlowchartInner storyVersion={props.storyVersion} />
    </ReactFlowProvider>
  );
}

export default Flowchart;
