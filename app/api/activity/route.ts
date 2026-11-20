import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import type {RowDataPacket} from 'mysql2';
import {currentUser,validOrigin} from '@/lib/auth';
import {database} from '@/lib/db';
import {directoryTools} from '@/lib/directory';
import {failJson,unexpected} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{const user=await currentUser(req);if(!user)return failJson('Sign in to view history.',401);const [rows]=await database().execute<RowDataPacket[]>('SELECT id,tool,status,created_at AS createdAt FROM activity WHERE user_id=? ORDER BY created_at DESC LIMIT 60',[user.id]);return NextResponse.json({jobs:rows})}catch(e){return unexpected(e)}}
export async function POST(req:NextRequest){if(!validOrigin(req))return failJson('Invalid origin.',403);try{const user=await currentUser(req);if(!user)return NextResponse.json({recorded:false});const body=await req.json();if(body.status!=='completed'||!directoryTools.some(t=>t.slug===body.tool))return failJson('Unknown activity.');await database().execute('INSERT INTO activity (id,user_id,tool,status) VALUES (?,?,?,?)',[randomUUID(),user.id,body.tool,'client_reported']);return NextResponse.json({recorded:true})}catch(e){return unexpected(e)}}
