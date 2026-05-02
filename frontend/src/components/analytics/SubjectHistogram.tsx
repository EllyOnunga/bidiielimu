import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  data: number[];
  width?: number;
  height?: number;
}

export const SubjectHistogram = ({ data, width = 600, height = 300 }: Props) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, innerWidth]);

    const bins = d3.bin()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(20))(data);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'bar-gradient')
      .attr('gradientTransform', 'rotate(90)');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#4f46e5');

    g.selectAll('rect')
      .data(bins)
      .enter().append('rect')
      .attr('x', d => x(d.x0 || 0) + 1)
      .attr('width', d => Math.max(0, x(d.x1 || 0) - x(d.x0 || 0) - 1))
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', 'url(#bar-gradient)')
      .attr('rx', 4)
      .transition()
      .duration(1000)
      .attr('y', d => y(d.length))
      .attr('height', d => innerHeight - y(d.length));

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(10))
      .attr('color', '#ffffff40')
      .selectAll('text')
      .style('font-weight', '900')
      .style('font-size', '10px');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#ffffff40')
      .selectAll('text')
      .style('font-weight', '900')
      .style('font-size', '10px');

  }, [data, width, height]);

  return (
    <div className="glass p-8 rounded-[40px] border border-white/5">
      <h4 className="text-lg font-black text-white mb-6 uppercase tracking-widest opacity-50">Score Distribution</h4>
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
};
