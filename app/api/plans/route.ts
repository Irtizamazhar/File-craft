import {NextRequest,NextResponse} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {database} from '@/lib/db';
import {currentUser} from '@/lib/auth';
import {unexpected} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{
 const user=await currentUser(req);
 const [plans]=await database().query<RowDataPacket[]>('SELECT id,name,enabled,max_file_bytes,max_task_bytes,max_files FROM subscription_plans ORDER BY max_file_bytes,id');
 let currentPlan='free';
 if(user){const [rows]=await database().execute<RowDataPacket[]>('SELECT plan_id FROM subscriptions WHERE user_id=? AND status=?',[user.id,'active']);currentPlan=rows[0]?.plan_id||'free'}
 return NextResponse.json({plans,currentPlan,authenticated:!!user,purchasesEnabled:false,limitsEnforcement:'Browser resource limits; no server document processing or paid usage metering.'},{headers:{'Cache-Control':'no-store'}});
}catch(e){return unexpected(e)}}
