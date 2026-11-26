'use client';
import {useEffect,useRef,useState} from 'react';
import type {Sample} from '@/lib/typing/engine';
import styles from './typing.module.css';

/** Real per-second samples only: no smoothing, no invented start point. Lazy-loaded with the results. */
function niceMax(value:number){
  if(!(value>0))return 20;
  const step=value<=40?10:value<=100?20:value<=200?25:50;
  return Math.ceil(value*1.08/step)*step;
}
const seconds=(ms:number)=>Math.round(ms/100)/10;

export default function WpmChart({samples}:{samples:Sample[]}){
  const box=useRef<HTMLDivElement>(null);
  const [width,setWidth]=useState(640);
  const [hover,setHover]=useState<number|null>(null);
  useEffect(()=>{
    const el=box.current;if(!el)return;
    const measure=()=>setWidth(Math.max(260,Math.round(el.clientWidth)));
    measure();
    const observer=new ResizeObserver(measure);observer.observe(el);
    return ()=>observer.disconnect();
  },[]);
  if(samples.length<2)return <p className={styles.chartEmpty}>This test was too short for a speed graph. Graphs need at least two seconds of typing.</p>;

  const height=width<480?190:230;
  const pad={l:38,r:14,t:14,b:30};
  const end=samples[samples.length-1].t;
  const maxY=niceMax(Math.max(...samples.map(s=>Math.max(s.wpm,s.raw??0))));
  const x=(t:number)=>pad.l+t/end*(width-pad.l-pad.r);
  const y=(v:number)=>pad.t+(1-v/maxY)*(height-pad.t-pad.b);
  const line=(points:[number,number][])=>points.map(([px,py],i)=>(i?'L':'M')+px.toFixed(1)+' '+py.toFixed(1)).join(' ');
  const net=line(samples.map(s=>[x(s.t),y(s.wpm)]));
  const rawPoints=samples.filter(s=>s.raw!==null);
  const raw=line(rawPoints.map(s=>[x(s.t),y(s.raw as number)]));
  const yTicks=[0,.25,.5,.75,1].map(f=>Math.round(maxY*f));
  const totalSeconds=end/1000;
  const xStep=totalSeconds<=15?3:totalSeconds<=30?5:totalSeconds<=60?10:totalSeconds<=120?20:60;
  const xTicks:number[]=[];for(let s=xStep;s<=totalSeconds+0.001;s+=xStep)xTicks.push(s);
  const active=hover===null?null:samples[hover];

  function pointer(event:React.PointerEvent<SVGSVGElement>){
    const rect=event.currentTarget.getBoundingClientRect();
    const px=(event.clientX-rect.left)/rect.width*width;
    let best=0;
    samples.forEach((s,i)=>{if(Math.abs(x(s.t)-px)<Math.abs(x(samples[best].t)-px))best=i});
    setHover(best);
  }

  return <div className={styles.chart}>
    <ul className={styles.legend} aria-label="Graph legend">
      <li><span className={styles.swatchNet} aria-hidden="true"/>WPM (net, running total)</li>
      <li><span className={styles.swatchRaw} aria-hidden="true"/>Raw speed in each second</li>
      <li><span className={styles.swatchErr} aria-hidden="true"/>Second with a mistake</li>
    </ul>
    <div ref={box} className={styles.chartBox}>
      <svg width={width} height={height} role="img" aria-label={`Speed over ${seconds(end)} seconds. Final net speed ${Math.round(samples[samples.length-1].wpm)} WPM. A data table follows.`}
        onPointerMove={pointer} onPointerLeave={()=>setHover(null)}>
        {yTicks.map(v=><g key={v}><line x1={pad.l} x2={width-pad.r} y1={y(v)} y2={y(v)} className={styles.grid}/><text x={pad.l-7} y={y(v)+4} textAnchor="end" className={styles.axisText}>{v}</text></g>)}
        {xTicks.map(s=><text key={s} x={x(s*1000)} y={height-9} textAnchor="middle" className={styles.axisText}>{s}s</text>)}
        <path d={raw} className={styles.rawLine}/>
        <path d={net} className={styles.netLine}/>
        {samples.filter(s=>s.errors>0).map(s=><path key={s.t} d={`M${x(s.t)-4} ${height-pad.b+1} L${x(s.t)+4} ${height-pad.b+1} L${x(s.t)} ${height-pad.b-6} Z`} className={styles.errorMark}/>)}
        {active&&<g><line x1={x(active.t)} x2={x(active.t)} y1={pad.t} y2={height-pad.b} className={styles.crosshair}/><circle cx={x(active.t)} cy={y(active.wpm)} r={4.5} className={styles.netDot}/>{active.raw!==null&&<circle cx={x(active.t)} cy={y(active.raw)} r={4} className={styles.rawDot}/>}</g>}
      </svg>
      {active&&<div className={styles.tooltip} style={{left:Math.min(Math.max(x(active.t),70),width-70)}} aria-hidden="true">
        <b>{seconds(active.t)} s</b><span>WPM {Math.round(active.wpm)}</span><span>Raw {active.raw===null?'–':Math.round(active.raw)}</span><span>{active.errors} {active.errors===1?'mistake':'mistakes'}</span>
      </div>}
    </div>
    <details className={styles.dataTable}>
      <summary>Show graph data as a table</summary>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Graph data table"><table>
        <thead><tr><th scope="col">Time</th><th scope="col">WPM (net)</th><th scope="col">Raw speed that second</th><th scope="col">Mistakes that second</th></tr></thead>
        <tbody>{samples.map(s=><tr key={s.t}><td>{seconds(s.t)} s</td><td>{Math.round(s.wpm)}</td><td>{s.raw===null?'– (under 0.5 s)':Math.round(s.raw)}</td><td>{s.errors}</td></tr>)}</tbody>
      </table></div>
    </details>
  </div>;
}
