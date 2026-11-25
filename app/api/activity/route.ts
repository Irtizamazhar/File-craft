import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import type {RowDataPacket} from 'mysql2';
import {currentUser,validOrigin} from '@/lib/auth';
import {database} from '@/lib/db';
import {directoryTools} from '@/lib/directory';
import {failJson,handleError,readJson,unexpected} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{const user=await currentUser(req);if(!user)return failJson('Sign in to view history.',401);const [rows]=await database().execute<RowDataPacket[]>('SELECT id,tool,status,created_at AS createdAt FROM activity WHERE user_id=? ORDER BY created_at DESC LIMIT 60',[user.id]);
 // Dashboard totals (metadata only): all-time task count, distinct tools and the days with activity (for the streak).
 const [[totals]]=await database().execute<RowDataPacket[]>('SELECT COUNT(*) AS total,COUNT(DISTINCT tool) AS tools FROM activity WHERE user_id=?',[user.id]);
 const [days]=await database().execute<RowDataPacket[]>('SELECT DISTINCT DATE_FORMAT(created_at,\'%Y-%m-%d\') AS day FROM activity WHERE user_id=? AND created_at>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 400 DAY) ORDER BY day DESC',[user.id]);
 return NextResponse.json({jobs:rows,stats:{total:Number(totals?.total||0),tools:Number(totals?.tools||0),days:days.map(d=>String(d.day))}})}catch(e){return unexpected(e)}}
export async function POST(req:NextRequest){if(!validOrigin(req))return failJson('Invalid origin.',403);try{const user=await currentUser(req);if(!user)return NextResponse.json({recorded:false});const body=await readJson(req,2048);const tool=directoryTools.find(t=>t.slug===body.tool);if(body.status!=='completed'||!tool)return failJson('Unknown activity.');await database().execute('INSERT INTO activity (id,user_id,tool,status) VALUES (?,?,?,?)',[randomUUID(),user.id,tool.slug,'client_reported']);return NextResponse.json({recorded:true})}catch(e){return handleError(e)}}
