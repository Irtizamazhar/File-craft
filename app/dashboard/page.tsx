'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CircleCheck,FileText,Flame,Lock,Settings,Wrench,Zap} from 'lucide-react';
import {request} from '@/lib/api';
import {firstName,isPaid,useSession} from '@/lib/session-client';
import {activityLabel,relativeTime,toolBadge,toolName} from '@/lib/tool-meta';
import Avatar from '@/components/header/Avatar';
import SavedTools from '@/components/SavedTools';
import AccountSettings from '@/components/AccountSettings';

type Activity={id:string;tool:string;status:string;createdAt:string};
type Stats={total:number;tools:number;days:string[]};
// TODO(usage limits): no daily task limit is enforced anywhere yet; this number is only shown on the dashboard.
// Replace it with the plan's real limit when one exists (or hide the bar).
const DAILY_TASKS=50;
// TODO(savings): compression savings are not recorded per user yet, so "MB saved" shows 0 until they are.
const SAVED_MB=0;

const greeting=(hour:number)=>hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
const day=(d:Date)=>d.toISOString().slice(0,10);
/** Consecutive days with at least one task, ending today or yesterday (days are UTC dates from the server). */
function streakOf(days:string[]){
  const have=new Set(days),cursor=new Date();
  if(!have.has(day(cursor)))cursor.setUTCDate(cursor.getUTCDate()-1);
  let streak=0;
  while(have.has(day(cursor))){streak++;cursor.setUTCDate(cursor.getUTCDate()-1)}
  return streak;
}

export default function Dashboard(){
  const session=useSession();
  const user=session.status==='user'?session.user:null;
  const [jobs,setJobs]=useState<Activity[]|null>(null),[stats,setStats]=useState<Stats|null>(null),[error,setError]=useState(''),[all,setAll]=useState(false);
  useEffect(()=>{request<{jobs:Activity[];stats?:Stats}>('/activity').then(r=>{setJobs(r.jobs);setStats(r.stats??null)}).catch(e=>{setJobs([]);setError((e as Error).message)})},[]);
  const today=useMemo(()=>{if(!jobs)return 0;const start=new Date();start.setHours(0,0,0,0);return jobs.filter(j=>new Date(j.createdAt)>=start).length},[jobs]);

  if(!user)return <div className="dash-page"><div className="dash-wrap" aria-busy="true"><div className="dash-skeleton dash-skeleton-hero"/><div className="dash-skeleton-row">{[0,1,2,3].map(i=><div key={i} className="dash-skeleton"/>)}</div><span className="acct-sr">Loading your workspace…</span></div></div>;

  const paid=isPaid(user),plan=user.planName||'Free';
  const statCards:[string,string|number,string,typeof FileText][]=[
    ['red',stats?.total??jobs?.length??0,'Files processed',FileText],
    ['violet',stats?.tools??new Set(jobs?.map(j=>j.tool)).size,'Tools used',Wrench],
    ['green',SAVED_MB+' MB','Saved by compressing',CircleCheck],
    ['amber',(()=>{const n=stats?streakOf(stats.days):0;return n===1?'1 day':n+' days'})(),'Current streak',Flame],
  ];
  const shown=all?jobs??[]:(jobs??[]).slice(0,5);
  const memberSince=user.memberSince?new Date(user.memberSince).toLocaleDateString('en-US',{month:'short',year:'numeric'}):'—';
  const used=Math.min(today,DAILY_TASKS);

  return <div className="dash-page"><div className="dash-wrap">
    <section className="dash-card dash-welcome" aria-labelledby="dash-greeting">
      <Avatar name={user.name} size="lg" online/>
      <div className="dash-hero-text">
        <span className="dash-eyebrow">Your workspace</span>
        <h1 id="dash-greeting">{greeting(new Date().getHours())}, {firstName(user.name)} <span aria-hidden="true">👋</span></h1>
        <p>Pick up where you left off. File contents are never stored in your account.</p>
      </div>
      <div className="dash-hero-actions">
        <Link className="dash-btn dash-btn-outline" href="#account-settings"><Settings size={17} aria-hidden="true"/>Settings</Link>
        <Link className="dash-btn dash-btn-dark" href="/tools">Open all tools <ArrowRight size={17} aria-hidden="true"/></Link>
      </div>
    </section>

    <ul className="dash-stats" aria-label="Your usage">
      {statCards.map(([tone,value,label,Icon])=><li key={label} className="dash-card dash-stat">
        <span className={'dash-tile dash-tone-'+tone} aria-hidden="true"><Icon size={21}/></span>
        <div><strong>{jobs?value:'…'}</strong><span>{label}</span></div>
      </li>)}
    </ul>

    <div className="dash-grid">
      <div className="dash-col">
        <SavedTools/>
        <section className="dash-card" id="recent-activity" aria-labelledby="recent-title">
          <div className="dash-card-head"><h2 id="recent-title">Recent activity</h2>{(jobs?.length??0)>5&&<button type="button" className="dash-link" aria-expanded={all} onClick={()=>setAll(a=>!a)}>{all?'Show less':'View all'}</button>}</div>
          {jobs===null?<p className="dash-muted">Loading activity…</p>
          :jobs.length?<ul className="dash-activity">{shown.map(j=>{const badge=toolBadge(j.tool);return <li key={j.id}>
            <span className={'dash-badge dash-tone-'+badge.tone} aria-hidden="true">{badge.label}</span>
            <div><b>{activityLabel(j.tool)}</b><small>{toolName(j.tool)}</small></div>
            <span className="dash-pill">Completed</span>
            <time dateTime={new Date(j.createdAt).toISOString()}>{relativeTime(j.createdAt)}</time>
          </li>})}</ul>
          :<div className="dash-empty"><FileText size={26} aria-hidden="true"/><b>No recent activity</b><p>Use a tool while signed in and it will show up here. Only the tool name and time are recorded, never your files.</p><Link href="/tools" className="dash-link">Explore tools <ArrowRight size={15} aria-hidden="true"/></Link></div>}
          {error&&<p className="form-error" role="alert">{error}</p>}
        </section>
      </div>

      <div className="dash-col">
        <section className="dash-card" aria-labelledby="usage-title">
          <h2 id="usage-title">Daily usage</h2>
          <div className="dash-usage-row"><span>Tasks today</span><b>{today} / {DAILY_TASKS}</b></div>
          <div className="dash-meter" role="progressbar" aria-label="Tasks today" aria-valuemin={0} aria-valuemax={DAILY_TASKS} aria-valuenow={used}><i style={{width:(used/DAILY_TASKS*100)+'%'}}/></div>
          <div className="dash-usage-row dash-muted"><span>Resets at midnight</span><span>{Math.round(used/DAILY_TASKS*100)}%</span></div>
          {!paid&&<div className="dash-pro">
            <b><Zap size={17} aria-hidden="true"/>Editgoo Pro</b>
            <p>Unlimited tasks, bigger files, batch processing and no ads.</p>
            <Link href="/pricing" className="dash-btn dash-btn-light">Upgrade now</Link>
          </div>}
          <p className="dash-note"><Lock size={14} aria-hidden="true"/>Your files are deleted automatically after processing.</p>
        </section>
        <section className="dash-card" id="profile" aria-labelledby="account-title">
          <div className="dash-card-head"><h2 id="account-title">Account</h2><Link className="dash-link" href="#account-settings">Edit</Link></div>
          <dl className="dash-account">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Plan</dt><dd><span className="acct-pill">{plan}</span></dd></div>
            <div><dt>Member since</dt><dd>{memberSince}</dd></div>
          </dl>
        </section>
      </div>
    </div>

    <AccountSettings name={user.name}/>
  </div></div>;
}
