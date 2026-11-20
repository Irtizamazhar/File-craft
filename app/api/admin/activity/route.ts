import {NextRequest,NextResponse} from 'next/server';import type {RowDataPacket} from 'mysql2';
import {currentUser} from '@/lib/auth';import {database} from '@/lib/db';import {failJson,unexpected} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{const user=await currentUser(req);if(user?.role!=='admin')return failJson('Admin access required.',403);const [rows]=await database().query<RowDataPacket[]>('SELECT id,tool,status,created_at AS createdAt FROM activity ORDER BY created_at DESC LIMIT 40');return NextResponse.json({jobs:rows})}catch(e){return unexpected(e)}}
