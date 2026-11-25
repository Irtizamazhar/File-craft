import {initialOf} from '@/lib/session-client';

/** Round avatar: the user's first initial on the brand gradient, with an optional green "online" dot. */
export default function Avatar({name,size='md',online=false}:{name:string;size?:'sm'|'md'|'lg';online?:boolean}){
  return <span className={'acct-avatar acct-avatar-'+size} aria-hidden="true">{initialOf(name)}{online&&<i className="acct-online"/>}</span>;
}
