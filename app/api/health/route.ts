import {NextResponse} from 'next/server';import {database} from '@/lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
// Public liveness probe: reports only whether MySQL answers. No versions, hosts or configuration.
export async function GET(){let connected=false;try{await database().query('SELECT 1');connected=true}catch{}return NextResponse.json({app:'Editgoo',status:connected?'healthy':'degraded',mysql:connected,processing:'browser'},{status:connected?200:503,headers:{'Cache-Control':'no-store'}})}
