import { Github, Sparkles, Code, Brain, Zap, RotateCcw } from "lucide-react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ArcEdge from './edges/ArcEdge';

const WorkflowCircle = () => {
  // Calculate positions for 6 points around a circle
  const centerX = 450;
  const centerY = 350;
  const radius = 220;
  
  const steps = [
    {
      id: "step-1",
      title: "Code in Your Platform",
      description: "You code in a vibe coding platform like Lovable, Claude, or ChatGPT",
      icon: Code,
      color: "#8B5CF6"
    },
    {
      id: "step-2", 
      title: "Connect GitHub",
      description: "Connect your code repository to sync your latest work",
      icon: Github,
      color: "#10B981"
    },
    {
      id: "step-3",
      title: "Sync & Analyze",
      description: "We analyze your codebase with senior engineer insights",
      icon: Zap,
      color: "#F59E0B"
    },
    {
      id: "step-4",
      title: "Senior Translation", 
      description: "Get professional-grade code analysis and recommendations",
      icon: Brain,
      color: "#EF4444"
    },
    {
      id: "step-5",
      title: "Generate Prompts",
      description: "AI-crafted prompts for features, improvements, or custom requests",
      icon: Sparkles,
      color: "#EC4899"
    },
    {
      id: "step-6",
      title: "Copy & Continue",
      description: "Take ready-to-use prompts back to your AI platform and keep building",
      icon: RotateCcw,
      color: "#06B6D4"
    }
  ];

  const initialNodes: Node[] = [
    // Center node
    {
      id: 'center',
      type: 'default',
      position: { x: centerX - 60, y: centerY - 30 },
      data: { 
        label: (
          <div className="text-center">
            <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="font-semibold text-sm">AI Partner</div>
            <div className="text-xs text-muted-foreground">Continuous Evolution</div>
          </div>
        )
      },
      style: {
        backgroundColor: 'hsl(var(--card))',
        border: '2px solid hsl(var(--primary) / 0.2)',
        borderRadius: '12px',
        width: 120,
        height: 80,
      },
      draggable: false,
      selectable: false,
    },
    // Step nodes around the circle
    ...steps.map((step, index) => {
      const angle = (index * 60 - 90) * (Math.PI / 180); // Start from top, 60 degrees apart
      const x = centerX + radius * Math.cos(angle) - 100;
      const y = centerY + radius * Math.sin(angle) - 60;
      const Icon = step.icon;
      const stepNumber = index + 1;
      
      return {
        id: step.id,
        type: 'default',
        position: { x, y },
        data: { 
          label: (
            <div className="relative p-4">
              {/* Step Number Badge */}
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-white to-gray-100 border-2 flex items-center justify-center shadow-lg z-10" style={{ borderColor: step.color }}>
                <span className="text-sm font-bold" style={{ color: step.color }}>
                  {stepNumber}
                </span>
              </div>
              
              {/* Content */}
              <div className="text-center pt-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md" style={{ backgroundColor: step.color }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="font-bold text-sm mb-2 text-foreground">{step.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed px-1">{step.description}</div>
              </div>
            </div>
          )
        },
        style: {
          backgroundColor: 'hsl(var(--card))',
          border: `2px solid ${step.color}20`,
          borderRadius: '16px',
          width: 200,
          height: 140,
          boxShadow: `0 4px 12px ${step.color}15`,
        },
        draggable: false,
        selectable: false,
      };
    })
  ];

  const initialEdges: Edge[] = [
    // Clockwise circular connections between steps using custom arc edge
    ...steps.map((_, index) => {
      const currentStep = steps[index];
      const nextStep = steps[(index + 1) % steps.length];
      
      return {
        id: `edge-${index}`,
        source: currentStep.id,
        target: nextStep.id,
        type: 'arc',
        animated: true,
        style: { 
          stroke: 'hsl(var(--primary))', 
          strokeWidth: 3,
          strokeDasharray: '8 4',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
          width: 20,
          height: 20,
        },
        data: {
          centerX,
          centerY,
          curvature: 0.65,
        },
      } as Edge;
    }),
    // Subtle connections from center to each step
    ...steps.map((step) => ({
      id: `center-${step.id}`,
      source: 'center',
      target: step.id,
      type: 'straight',
      style: { 
        stroke: 'hsl(var(--primary) / 0.2)', 
        strokeWidth: 1,
        strokeDasharray: '3,3',
      },
    }))
  ];

  const edgeTypes = { arc: ArcEdge } as const;

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[800px] bg-gradient-to-br from-background to-muted/20 rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag={false}
        zoomOnDoubleClick={false}
        style={{ backgroundColor: "transparent" }}
      >
        <Background color="hsl(var(--muted-foreground) / 0.1)" gap={20} />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCircle;