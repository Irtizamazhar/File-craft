import {NextResponse} from 'next/server';import {database} from '@/lib/db';
export const runtime='nodejs';
export async function GET(){let connected=false;try{await database().query('SELECT 1');connected=true}catch{}return NextResponse.json({app:'FileCraft',status:'running',mysql:connected,processing:'browser'})}
