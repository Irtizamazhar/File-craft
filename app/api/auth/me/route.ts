import {NextRequest,NextResponse} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {currentUser} from '@/lib/auth';
import {database} from '@/lib/db';
import {unexpected} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
// `user` keeps its original shape; `account` adds the plan and the member-since date for the signed-in header and
// dashboard (null when signed out, or if those details cannot be read).
async function accountOf(userId:string){
 try{
  const [rows]=await database().execute<RowDataPacket[]>(
   'SELECT u.created_at AS createdAt,COALESCE(s.plan_id,\'free\') AS plan,COALESCE(p.name,\'Free\') AS planName FROM users u LEFT JOIN subscriptions s ON s.user_id=u.id AND s.status=\'active\' LEFT JOIN subscription_plans p ON p.id=COALESCE(s.plan_id,\'free\') WHERE u.id=? LIMIT 1',[userId]);
  const row=rows[0];if(!row)return null;
  return {plan:String(row.plan),planName:String(row.planName),memberSince:row.createdAt?new Date(row.createdAt).toISOString():null};
 }catch{return null}
}
export async function GET(req:NextRequest){try{const user=await currentUser(req);return NextResponse.json({user,account:user?await accountOf(user.id):null},{headers:{'Cache-Control':'no-store'}})}catch(e){return unexpected(e)}}
