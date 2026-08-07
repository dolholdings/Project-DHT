import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Gauge, Users, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { User, TimeEntry, Task } from '../../types';

interface D3CapacityVelocityGaugeWidgetProps {
  users: User[];
  timeEntries: TimeEntry[];
  tasks: Task[];
  theme?: 'light' | string;
}

export const D3CapacityVelocityGaugeWidget: React.FC<D3CapacityVelocityGaugeWidgetProps> = ({
  users = [],
  timeEntries = [],
  tasks = [],
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const gaugeRef = useRef<SVGSVGElement | null>(null);

  // Calculate overall capacity utilization
  const totalLogged = useMemo(() => {
    return timeEntries.reduce((acc, curr) => acc + curr.hours, 0);
  }, [timeEntries]);

  // Assume standard weekly team capacity of 40 hrs / active user
  const targetWeeklyCapacity = useMemo(() => {
    const activeCount = users.length || 1;
    return activeCount * 40;
  }, [users]);

  const utilizationPercent = Math.min(
    100,
    Math.round((totalLogged / targetWeeklyCapacity) * 100)
  );

  // Render D3 Arc Gauge
  useEffect(() => {
    if (!gaugeRef.current) return;

    const svg = d3.select(gaugeRef.current);
    svg.selectAll('*').remove();

    const width = 200;
    const height = 130;
    const radius = Math.min(width, height * 2) / 2 - 10;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height - 10})`);

    const arcGenerator = d3
      .arc()
      .innerRadius(radius - 18)
      .outerRadius(radius)
      .cornerRadius(6);

    // Background Arc (-Math.PI/2 to Math.PI/2)
    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .style('fill', isLight ? '#e2e8f0' : '#1e293b')
      .attr('d', arcGenerator as any);

    // Value Arc
    const angleScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 2, Math.PI / 2]);

    const targetAngle = angleScale(utilizationPercent);

    // Color gradient / fill
    const color =
      utilizationPercent > 90
        ? '#f43f5e'
        : utilizationPercent > 70
        ? '#3BC0BB'
        : '#0773BB';

    g.append('path')
      .datum({ startAngle: -Math.PI / 2, endAngle: targetAngle })
      .style('fill', color)
      .attr('d', arcGenerator as any);

    // Center Value Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-10px')
      .style('font-size', '24px')
      .style('font-weight', '900')
      .style('fill', isLight ? '#0f172a' : '#ffffff')
      .text(`${utilizationPercent}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '12px')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '1px')
      .style('fill', isLight ? '#64748b' : '#94a3b8')
      .text('CAPACITY LOAD');
  }, [utilizationPercent, isLight]);

  // Member workload data
  const memberData = useMemo(() => {
    return users.slice(0, 5).map((u) => {
      const hours = timeEntries
        .filter((te) => te.userId === u.id)
        .reduce((a, b) => a + b.hours, 0);
      const activeTasks = tasks.filter(
        (t) => t.assigneeIds.includes(u.id) && t.status !== 'Done'
      ).length;
      return {
        user: u,
        hours,
        activeTasks,
        percent: Math.min(100, Math.round((hours / 40) * 100))
      };
    });
  }, [users, timeEntries, tasks]);

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border space-y-5 transition-all shadow-xl relative overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#16222F] border-[#233549] text-slate-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200/20">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-[#0773BB]/20 border-[#0773BB]/40 text-[#3BC0BB]'
          }`}>
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Team Capacity & Velocity Gauge
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3BC0BB]/20 text-[#3BC0BB] border border-[#3BC0BB]/40">
                D3.JS
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              D3-driven team workload velocity and capacity utilization gauge.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Total Logged:</span>
          <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {totalLogged} hrs / {targetWeeklyCapacity} hrs
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* D3 SVG Arc Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl border bg-slate-50/50 dark:bg-[#0D1520]/50 border-slate-200 dark:border-[#233549]">
          <svg ref={gaugeRef} className="w-48 h-32" />
          <div className="flex items-center justify-between w-full pt-2 text-[11px] text-slate-400 border-t border-slate-200/20 font-mono">
            <span>0% (Idle)</span>
            <span>100% (Full Capacity)</span>
          </div>
        </div>

        {/* Member Capacity Bars */}
        <div className="md:col-span-7 space-y-3">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
            Top Assigned Members Load:
          </span>
          {memberData.map((m) => (
            <div key={m.user.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img src={m.user.avatar} alt={m.user.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-[#0773BB]" />
                  <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{m.user.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-slate-400">{m.activeTasks} active tasks</span>
                  <span className="font-bold text-[#3BC0BB]">{m.hours} hrs ({m.percent}%)</span>
                </div>
              </div>
              <div className={`h-2 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#0D1520]'}`}>
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#0773BB] to-[#3BC0BB]"
                  style={{ width: `${m.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
