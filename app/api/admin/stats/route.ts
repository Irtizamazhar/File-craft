import {NextRequest,NextResponse} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {currentUser} from '@/lib/auth';import {database} from '@/lib/db';import {failJson,unexpected} from '@/lib/http';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{const user=await currentUser(req);if(user?.role!=='admin')return failJson('Admin access required.',403);const [[users]]=await database().query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM users');const [[events]]=await database().query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM activity');const [[messages]]=await database().query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM contact_messages');return NextResponse.json({users:users.count,activities:events.count,messages:messages.count})}catch(e){return unexpected(e)}}
