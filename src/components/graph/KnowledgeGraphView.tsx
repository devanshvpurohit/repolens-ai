import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { useRepoStore } from "@/stores/repo-store";
import { CustomNode } from "./CustomNode";
import type { GraphNode, GraphEdge } from "@repolens/graph-schema";

const nodeTypes: any = {
  custom: CustomNode,
};

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 90 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition ? nodeWithPosition.x - 110 : 0,
        y: nodeWithPosition ? nodeWithPosition.y - 45 : 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function KnowledgeGraphView() {
  const {
    graph,
    selectedNode,
    selectNode,
    selectedTypeFilter,
    selectedLayerId,
    searchFilter,
  } = useRepoStore();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    // Apply Filters
    let filteredNodes = graph.nodes;

    if (selectedTypeFilter) {
      filteredNodes = filteredNodes.filter((n) => n.type === selectedTypeFilter);
    }

    if (selectedLayerId) {
      const layer = graph.layers.find((l) => l.id === selectedLayerId);
      if (layer) {
        const allowed = new Set(layer.nodeIds);
        filteredNodes = filteredNodes.filter((n) => allowed.has(n.id));
      }
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filteredNodes = filteredNodes.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          (n.filePath && n.filePath.toLowerCase().includes(q))
      );
    }

    const validNodeIds = new Set(filteredNodes.map((n) => n.id));

    const flowNodes: Node[] = filteredNodes.map((node) => ({
      id: node.id,
      type: "custom",
      data: { node },
      position: { x: 0, y: 0 },
      selected: selectedNode?.id === node.id,
    }));

    const flowEdges: Edge[] = graph.edges
      .filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
      .map((edge, idx) => {
        const isConnectedToSelected =
          selectedNode &&
          (edge.source === selectedNode.id || edge.target === selectedNode.id);

        return {
          id: `edge-${idx}-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: edge.type,
          type: "smoothstep",
          animated: !!isConnectedToSelected,
          style: {
            stroke: isConnectedToSelected ? "#60a5fa" : "#334155",
            strokeWidth: isConnectedToSelected ? 2.5 : 1.5,
          },
          labelStyle: { fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
          labelBgStyle: { fill: "#0f172a", fillOpacity: 0.8 },
        };
      });

    return getLayoutedElements(flowNodes, flowEdges);
  }, [graph, selectedNode, selectedTypeFilter, selectedLayerId, searchFilter]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const originalNode = graph?.nodes.find((n) => n.id === node.id);
      if (originalNode) {
        selectNode(originalNode);
      }
    },
    [graph, selectNode]
  );

  if (!graph) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        No graph data available.
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="bg-slate-900 border border-slate-800 fill-slate-200" />
        <MiniMap
          nodeColor="#3b82f6"
          maskColor="rgba(15, 23, 42, 0.8)"
          className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}
