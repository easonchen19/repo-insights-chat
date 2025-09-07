import React, { useEffect, useRef } from 'react';

interface DependencyNode {
  id: string;
  name: string;
  children: DependencyNode[];
  depth: number;
}

interface DependencyTreeChartProps {
  dependencies: Record<string, string[]>;
}

const DependencyTreeChart: React.FC<DependencyTreeChartProps> = ({ dependencies }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || Object.keys(dependencies).length === 0) return;

    const svg = svgRef.current;
    svg.innerHTML = ''; // Clear previous content

    // Build tree structure
    const buildTree = (): DependencyNode[] => {
      const allFiles = new Set([
        ...Object.keys(dependencies),
        ...Object.values(dependencies).flat()
      ]);

      // Find entry points (files not imported by others)
      const imported = new Set(Object.values(dependencies).flat());
      const entryPoints = Array.from(allFiles).filter(file => !imported.has(file));

      const createNode = (filePath: string, depth = 0, visited = new Set<string>()): DependencyNode | null => {
        if (visited.has(filePath) || depth > 3) return null;
        visited.add(filePath);

        const name = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || filePath;
        const deps = dependencies[filePath] || [];
        
        const children: DependencyNode[] = [];
        deps.slice(0, 4).forEach(dep => {
          const child = createNode(dep, depth + 1, new Set(visited));
          if (child) children.push(child);
        });

        return {
          id: filePath,
          name,
          children,
          depth
        };
      };

      return entryPoints.slice(0, 3).map(entry => createNode(entry)).filter(Boolean) as DependencyNode[];
    };

    const trees = buildTree();
    if (trees.length === 0) return;

    // Layout constants
    const nodeWidth = 120;
    const nodeHeight = 30;
    const horizontalSpacing = 150;
    const verticalSpacing = 50;
    const marginTop = 20;
    const marginLeft = 20;

    // Calculate positions
    const positions = new Map<string, { x: number; y: number }>();
    let globalY = marginTop;

    const calculatePositions = (nodes: DependencyNode[], startX = marginLeft) => {
      nodes.forEach((node, index) => {
        const x = startX;
        const y = globalY;
        positions.set(node.id, { x, y });

        if (node.children.length > 0) {
          globalY += verticalSpacing;
          calculatePositions(node.children, startX + horizontalSpacing);
        }
        
        if (index < nodes.length - 1) {
          globalY += verticalSpacing;
        }
      });
    };

    calculatePositions(trees);

    // Set SVG dimensions
    const maxX = Math.max(...Array.from(positions.values()).map(p => p.x)) + nodeWidth + marginLeft;
    const maxY = Math.max(...Array.from(positions.values()).map(p => p.y)) + nodeHeight + marginTop;
    svg.setAttribute('width', Math.max(400, maxX).toString());
    svg.setAttribute('height', Math.max(200, maxY).toString());

    // Draw connections
    const drawConnections = (nodes: DependencyNode[]) => {
      nodes.forEach(node => {
        const parentPos = positions.get(node.id);
        if (!parentPos) return;

        node.children.forEach(child => {
          const childPos = positions.get(child.id);
          if (!childPos) return;

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', (parentPos.x + nodeWidth).toString());
          line.setAttribute('y1', (parentPos.y + nodeHeight / 2).toString());
          line.setAttribute('x2', childPos.x.toString());
          line.setAttribute('y2', (childPos.y + nodeHeight / 2).toString());
          line.setAttribute('stroke', 'hsl(var(--border))');
          line.setAttribute('stroke-width', '1');
          line.setAttribute('opacity', '0.6');
          svg.appendChild(line);
        });

        drawConnections(node.children);
      });
    };

    // Draw nodes
    const drawNodes = (nodes: DependencyNode[]) => {
      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;

        // Node rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', pos.x.toString());
        rect.setAttribute('y', pos.y.toString());
        rect.setAttribute('width', nodeWidth.toString());
        rect.setAttribute('height', nodeHeight.toString());
        rect.setAttribute('rx', '6');
        rect.setAttribute('fill', node.depth === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))');
        rect.setAttribute('stroke', 'hsl(var(--border))');
        rect.setAttribute('stroke-width', '1');
        svg.appendChild(rect);

        // Node text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (pos.x + nodeWidth / 2).toString());
        text.setAttribute('y', (pos.y + nodeHeight / 2 + 4).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-family', 'ui-sans-serif, system-ui, sans-serif');
        text.setAttribute('fill', node.depth === 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))');
        text.textContent = node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name;
        
        // Add title for full name on hover
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = node.name;
        text.appendChild(title);
        
        svg.appendChild(text);

        drawNodes(node.children);
      });
    };

    drawConnections(trees);
    drawNodes(trees);

  }, [dependencies]);

  if (Object.keys(dependencies).length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No internal dependencies detected
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-background p-4">
      <svg ref={svgRef} className="w-full h-auto min-h-[200px]" />
    </div>
  );
};

export default DependencyTreeChart;