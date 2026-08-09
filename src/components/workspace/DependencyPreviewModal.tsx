import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Network,
  GitBranch,
  ArrowRight,
  Search,
  RefreshCw,
  Copy,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  ListTodo,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { ProjectTemplate, TemplateTask, TemplateDependency } from '../../types';

interface DependencyPreviewModalProps {
  template: ProjectTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate?: (template: ProjectTemplate) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  task: TemplateTask;
  level: number;
  inDegree: number;
  outDegree: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

export const DependencyPreviewModal: React.FC<DependencyPreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onApplyTemplate
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [layoutMode, setLayoutMode] = useState<'dag' | 'force'>('dag');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Handle modal resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setDimensions({
            width: Math.max(600, entry.contentRect.width),
            height: Math.max(450, entry.contentRect.height)
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Compute node levels (topological order) for DAG view
  const graphData = useMemo(() => {
    if (!template || !template.tasks) return { nodes: [], links: [] };

    let tasks = template.tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tempId.toLowerCase().includes(q));
    }
    if (filterPriority !== 'all') {
      tasks = tasks.filter(t => (t.priority || 'Medium').toLowerCase() === filterPriority.toLowerCase());
    }

    const validTaskIds = new Set(tasks.map(t => t.tempId));

    // Filter links where both source and target exist
    const rawLinks = (template.dependencies || []).filter(
      d => validTaskIds.has(d.dependsOnTaskTempId) && validTaskIds.has(d.taskTempId)
    );

    // Degree maps
    const inDegreeMap = new Map<string, number>();
    const outDegreeMap = new Map<string, number>();
    tasks.forEach(t => {
      inDegreeMap.set(t.tempId, 0);
      outDegreeMap.set(t.tempId, 0);
    });

    rawLinks.forEach(d => {
      outDegreeMap.set(d.dependsOnTaskTempId, (outDegreeMap.get(d.dependsOnTaskTempId) || 0) + 1);
      inDegreeMap.set(d.taskTempId, (inDegreeMap.get(d.taskTempId) || 0) + 1);
    });

    // Compute DAG levels (Rank)
    const levelMap = new Map<string, number>();
    tasks.forEach(t => levelMap.set(t.tempId, 0));

    // Relaxation algorithm for topological levels
    for (let iter = 0; iter < tasks.length; iter++) {
      let updated = false;
      rawLinks.forEach(d => {
        const srcLvl = levelMap.get(d.dependsOnTaskTempId) || 0;
        const tgtLvl = levelMap.get(d.taskTempId) || 0;
        if (tgtLvl <= srcLvl) {
          levelMap.set(d.taskTempId, srcLvl + 1);
          updated = true;
        }
      });
      if (!updated) break;
    }

    const nodes: GraphNode[] = tasks.map(t => ({
      id: t.tempId,
      task: t,
      level: levelMap.get(t.tempId) || 0,
      inDegree: inDegreeMap.get(t.tempId) || 0,
      outDegree: outDegreeMap.get(t.tempId) || 0
    }));

    const links: GraphLink[] = rawLinks.map(d => ({
      source: d.dependsOnTaskTempId,
      target: d.taskTempId,
      type: d.type || 'finish_to_start'
    }));

    return { nodes, links };
  }, [template, searchQuery, filterPriority]);

  // Selected task details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !graphData.nodes) return null;
    return graphData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData]);

  const directPredecessors = useMemo(() => {
    if (!selectedNodeId || !template) return [];
    const predIds = (template.dependencies || [])
      .filter(d => d.taskTempId === selectedNodeId)
      .map(d => d.dependsOnTaskTempId);
    return (template.tasks || []).filter(t => predIds.includes(t.tempId));
  }, [selectedNodeId, template]);

  const directSuccessors = useMemo(() => {
    if (!selectedNodeId || !template) return [];
    const succIds = (template.dependencies || [])
      .filter(d => d.dependsOnTaskTempId === selectedNodeId)
      .map(d => d.taskTempId);
    return (template.tasks || []).filter(t => succIds.includes(t.tempId));
  }, [selectedNodeId, template]);

  // Render D3 Graph
  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Create main container group for zooming
    const zoomGroup = svg.append('g').attr('class', 'zoom-group');

    // Configure Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    svg.call(zoomBehavior);

    // SVG Marker Definitions for Arrows
    const defs = svg.append('defs');

    // Default arrow marker
    defs.append('marker')
      .attr('id', 'arrow-default')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    // Highlighted source arrow
    defs.append('marker')
      .attr('id', 'arrow-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#3BC0BB');

    // Deep copy nodes and links for D3 simulation mutation
    const nodes: GraphNode[] = JSON.parse(JSON.stringify(graphData.nodes));
    const links: GraphLink[] = JSON.parse(JSON.stringify(graphData.links));

    if (nodes.length === 0) {
      zoomGroup.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94A3B8')
        .attr('font-size', '14px')
        .text('No matching task dependencies found.');
      return;
    }

    if (layoutMode === 'dag') {
      // Group nodes by level
      const levelGroups = new Map<number, GraphNode[]>();
      nodes.forEach(n => {
        const lvl = n.level || 0;
        if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
        levelGroups.get(lvl)!.push(n);
      });

      const maxLevel = Math.max(...Array.from(levelGroups.keys()), 0);
      const levelSpacing = Math.min(220, (width - 160) / Math.max(1, maxLevel));

      levelGroups.forEach((levelNodes, lvl) => {
        const totalInLevel = levelNodes.length;
        const verticalSpacing = Math.min(90, (height - 120) / Math.max(1, totalInLevel));
        const startY = (height - (totalInLevel - 1) * verticalSpacing) / 2;

        levelNodes.forEach((node, idx) => {
          node.x = 80 + lvl * levelSpacing;
          node.y = startY + idx * verticalSpacing;
        });
      });
    }

    // Link paths render
    const linkPath = zoomGroup.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link-line')
      .attr('stroke-width', (d) => {
        const srcId = typeof d.source === 'object' ? d.source.id : d.source;
        const tgtId = typeof d.target === 'object' ? d.target.id : d.target;
        return (selectedNodeId === srcId || selectedNodeId === tgtId) ? 2.5 : 1.5;
      })
      .attr('stroke', (d) => {
        const srcId = typeof d.source === 'object' ? d.source.id : d.source;
        const tgtId = typeof d.target === 'object' ? d.target.id : d.target;
        if (selectedNodeId === srcId) return '#3BC0BB';
        if (selectedNodeId === tgtId) return '#F59E0B';
        return '#334155';
      })
      .attr('stroke-dasharray', (d) => d.type === 'start_to_start' ? '4,4' : 'none')
      .attr('fill', 'none')
      .attr('marker-end', (d) => {
        const srcId = typeof d.source === 'object' ? d.source.id : d.source;
        return selectedNodeId === srcId ? 'url(#arrow-active)' : 'url(#arrow-default)';
      });

    // Node Group
    const nodeGroup = zoomGroup.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-card')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedNodeId(prev => (prev === d.id ? null : d.id));
      });

    // Drag behavior for nodes
    let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

    if (layoutMode === 'force') {
      simulation = d3.forceSimulation<GraphNode, GraphLink>(nodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(140))
        .force('charge', d3.forceManyBody().strength(-350))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(60));

      const drag = d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active && simulation) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      nodeGroup.call(drag as any);

      simulation.on('tick', () => {
        linkPath.attr('d', (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`);
      });
    } else {
      // Static DAG positions update link bezier curves
      linkPath.attr('d', (d: any) => {
        const sourceNode = nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        const targetNode = nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        if (!sourceNode || !targetNode) return '';

        const sx = sourceNode.x || 0;
        const sy = sourceNode.y || 0;
        const tx = targetNode.x || 0;
        const ty = targetNode.y || 0;

        const dx = (tx - sx) / 2;
        return `M${sx},${sy}C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`;
      });

      nodeGroup.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    }

    // Node visual representation (Card Rect)
    nodeGroup.append('rect')
      .attr('x', -70)
      .attr('y', -24)
      .attr('width', 140)
      .attr('height', 48)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', (d) => {
        if (selectedNodeId === d.id) return '#1E1B4B'; // Indigo accent
        return '#0D1520';
      })
      .attr('stroke', (d) => {
        if (selectedNodeId === d.id) return '#818CF8';
        if (d.task.priority === 'Urgent' || d.task.priority === 'High') return '#F43F5E';
        if (d.task.priority === 'Medium') return '#F59E0B';
        return '#38BDF8';
      })
      .attr('stroke-width', (d) => (selectedNodeId === d.id ? 2.5 : 1.5))
      .attr('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))');

    // Priority Indicator Badge Dot
    nodeGroup.append('circle')
      .attr('cx', -58)
      .attr('cy', -10)
      .attr('r', 4)
      .attr('fill', (d) => {
        if (d.task.priority === 'Urgent' || d.task.priority === 'High') return '#F43F5E';
        if (d.task.priority === 'Medium') return '#F59E0B';
        return '#38BDF8';
      });

    // Node Task Title Text (Truncated)
    nodeGroup.append('text')
      .attr('x', -48)
      .attr('y', -7)
      .attr('fill', '#F8FAFC')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text((d) => {
        const title = d.task.title || d.id;
        return title.length > 15 ? title.substring(0, 13) + '…' : title;
      });

    // Node Meta Text (Day Offset & Duration)
    nodeGroup.append('text')
      .attr('x', -58)
      .attr('y', 12)
      .attr('fill', '#94A3B8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text((d) => `Day +${d.task.dayOffset || 0} • ${d.task.durationDays || 5}d`);

    // In / Out Degree Badge count
    nodeGroup.append('text')
      .attr('x', 52)
      .attr('y', 12)
      .attr('text-anchor', 'end')
      .attr('fill', '#3BC0BB')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text((d) => {
        if (d.inDegree > 0 || d.outDegree > 0) {
          return `🔗${d.inDegree + d.outDegree}`;
        }
        return '';
      });

    return () => {
      if (simulation) simulation.stop();
    };
  }, [isOpen, graphData, layoutMode, selectedNodeId, dimensions]);

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16222F] border border-[#233549] rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* MODAL HEADER */}
        <div className="p-4 bg-[#0D1520] border-b border-[#233549] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
              <Network className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white truncate">D3 Task Dependency Graph</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                  {template.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-[#3BC0BB]/40 text-xs font-mono">
                  {template.version || 'v1.0'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Interactive D3 graph representation of task linkages, predecessors, and execution stages before spawning workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onApplyTemplate && (
              <button
                type="button"
                onClick={() => {
                  onApplyTemplate(template);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>Instantiate Template</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#16222F] text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="p-3 bg-[#111A24] border-b border-[#233549] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Left Controls: Layout toggle & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-[#0D1520] border border-[#233549] rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setLayoutMode('dag')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  layoutMode === 'dag'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Layered DAG</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('force')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  layoutMode === 'force'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Force Directed</span>
              </button>
            </div>

            {/* Filter Priority */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[#0D1520] border border-[#233549] text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search graph nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D1520] border border-[#233549] text-white pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Right Controls: Stats & Reset */}
          <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-[#0D1520] border border-[#233549] text-teal-300">
              Tasks: {graphData.nodes.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0D1520] border border-[#233549] text-purple-300">
              Dependencies: {graphData.links.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0D1520] border border-[#233549] text-amber-300">
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>

            {selectedNodeId && (
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-1"
              >
                Reset Focus
              </button>
            )}
          </div>
        </div>

        {/* MAIN BODY: GRAPH CANVAS & INSPECTOR PANEL */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* SVG Canvas Area */}
          <div ref={containerRef} className="flex-1 bg-[#090D14] relative overflow-hidden min-h-[350px]">
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Instructions overlay */}
            <div className="absolute bottom-3 left-3 bg-[#0D1520]/90 border border-[#233549] backdrop-blur-sm p-2 rounded-xl text-[10px] text-slate-400 font-mono space-y-1 pointer-events-none">
              <div>💡 <strong>Pan / Zoom:</strong> Drag canvas or scroll wheel</div>
              <div>🎯 <strong>Inspect Node:</strong> Click any task card</div>
              {layoutMode === 'force' && <div>🧲 <strong>Re-position:</strong> Drag task node</div>}
            </div>
          </div>

          {/* SIDE INSPECTOR PANEL */}
          <div className="w-full md:w-80 bg-[#0D1520] border-t md:border-t-0 md:border-l border-[#233549] p-4 overflow-y-auto space-y-4 shrink-0 text-xs">
            {selectedNode ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#233549] pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white text-sm">Node Inspector</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedNode.task.priority === 'High' || selectedNode.task.priority === 'Urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {selectedNode.task.priority || 'Medium'} Priority
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Task Title</span>
                  <h3 className="text-sm font-bold text-white leading-tight">{selectedNode.task.title}</h3>
                </div>

                {selectedNode.task.description && (
                  <div className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549] text-slate-300 text-xs leading-relaxed">
                    {selectedNode.task.description}
                  </div>
                )}

                {/* Task Metrics */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549]">
                    <span className="text-slate-400 block text-[10px]">Start Day Offset:</span>
                    <span className="text-teal-300 font-bold">Day +{selectedNode.task.dayOffset || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#16222F] border border-[#233549]">
                    <span className="text-slate-400 block text-[10px]">Estimated Effort:</span>
                    <span className="text-purple-300 font-bold">{selectedNode.task.estimatedHours || 10} hrs</span>
                  </div>
                </div>

                {/* Direct Predecessors */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    <span>Direct Predecessors ({directPredecessors.length})</span>
                  </span>
                  {directPredecessors.length > 0 ? (
                    <div className="space-y-1.5">
                      {directPredecessors.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedNodeId(p.tempId)}
                          className="w-full text-left p-2 rounded-xl bg-[#16222F] hover:bg-amber-500/10 border border-[#233549] hover:border-amber-500/40 text-slate-200 hover:text-amber-300 transition-all text-xs font-medium truncate block"
                        >
                          • {p.title} <span className="text-[10px] text-slate-400 font-mono">(Day +{p.dayOffset || 0})</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No predecessors. This task can start on Day 0.</p>
                  )}
                </div>

                {/* Direct Successors */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Direct Successors ({directSuccessors.length})</span>
                  </span>
                  {directSuccessors.length > 0 ? (
                    <div className="space-y-1.5">
                      {directSuccessors.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedNodeId(s.tempId)}
                          className="w-full text-left p-2 rounded-xl bg-[#16222F] hover:bg-teal-500/10 border border-[#233549] hover:border-teal-500/40 text-slate-200 hover:text-teal-300 transition-all text-xs font-medium truncate block"
                        >
                          ➔ {s.title} <span className="text-[10px] text-slate-400 font-mono">(Day +{s.dayOffset || 0})</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No downstream successors depend on this task.</p>
                  )}
                </div>

                {/* Subtasks Checklist */}
                {selectedNode.task.subtasks && selectedNode.task.subtasks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#233549]">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-purple-400" />
                      <span>Subtask Checklist ({selectedNode.task.subtasks.length})</span>
                    </span>
                    <div className="space-y-1 pl-1">
                      {selectedNode.task.subtasks.map((st, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-center gap-2 p-1.5 rounded bg-[#16222F] border border-[#233549]">
                          <div className="w-3 h-3 rounded border border-slate-600 bg-[#0D1520]" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <Network className="w-10 h-10 text-purple-400/50" />
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Select a Task Node</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Click any task node on the D3 graph to inspect predecessor linkages, effort duration, and downstream dependencies.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 bg-[#0D1520] border-t border-[#233549] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>🎯 Tip: Switch between <strong>Layered DAG</strong> and <strong>Force Directed</strong> layouts to view task flow angles.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#16222F] hover:bg-[#233549] text-slate-300 hover:text-white transition-all font-semibold"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
