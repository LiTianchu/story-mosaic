import { BaseEdge, EdgeLabelRenderer, getStraightPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { EditorEdgeData } from "./Flowchart";

// Custom edge component for normal edges in the flowchart
function NormalEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, selected } = props;
  const data = props.data as EditorEdgeData | undefined;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const strokeColor = selected ? "#3F5F3F" : "#8A907D";
  const strokeWidth = selected ? 6 : 3;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          transition: "stroke-width 120ms ease",
        }}
      />
      <path
        className="react-flow__edge-interaction"
        d={edgePath}
        style={{
          strokeWidth: 18,
          stroke: "transparent",
          cursor: "pointer",
          pointerEvents: selected ? "none" : "visibleStroke",
        }}
      />
      {selected && data?.onDelete && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-auto"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              zIndex: 1000,
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                data.onDelete?.();
              }}
              className="rounded-full border border-danger bg-paper px-2 py-[2px] text-[0.65rem] font-semibold uppercase tracking-wide text-danger shadow-md transition hover:text-danger/80"
            >
              Delete
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default NormalEdge;
