import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface DependencyTreeChartProps {
  dependencies: Record<string, string[]>;
}

const DependencyTreeChart: React.FC<DependencyTreeChartProps> = ({ dependencies }) => {
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];
    
    if (Object.keys(dependencies).length === 0) {
      return { nodes: [], edges: [] };
    }

    // Get all unique files
    const allFiles = new Set([
      ...Object.keys(dependencies),
      ...Object.values(dependencies).flat()
    ]);

    // Create nodes
    const fileList = Array.from(allFiles).slice(0, 20); // Limit for performance
    fileList.forEach((filePath, index) => {
      const fileName = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || filePath;
      const isEntryPoint = !Object.values(dependencies).flat().includes(filePath);
      
      // Simple grid layout
      const x = (index % 4) * 200;
      const y = Math.floor(index / 4) * 100;
      
      nodeMap.set(filePath, {
        id: filePath,
        data: { 
          label: fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName 
        },
        position: { x, y },
        type: 'default',
        style: {
          background: isEntryPoint ? '#3b82f6' : '#64748b',
          color: 'white',
          border: '1px solid #334155',
          borderRadius: '8px',
          fontSize: '12px',
          padding: '8px 12px',
          minWidth: '120px',
          textAlign: 'center',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });

    // Create edges
    Object.entries(dependencies).forEach(([source, targets]) => {
      if (!nodeMap.has(source)) return;
      
      targets.forEach((target) => {
        if (nodeMap.has(target)) {
          edgeList.push({
            id: `${source}-${target}`,
            source,
            target,
            type: 'smoothstep',
            style: { stroke: '#64748b', strokeWidth: 1 },
            animated: false,
          });
        }
      });
    });

    return { 
      nodes: Array.from(nodeMap.values()), 
      edges: edgeList 
    };
  }, [dependencies]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground border rounded-lg">
        No internal dependencies detected
      </div>
    );
  }

  return (
    <div className="w-full h-96 border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
        <Controls />
        <MiniMap 
          style={{ height: 80, width: 120 }}
          nodeColor="#64748b"
        />
      </ReactFlow>
    </div>
  );
};

export default DependencyTreeChart;