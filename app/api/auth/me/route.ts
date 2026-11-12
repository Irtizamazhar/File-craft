import {NextRequest,NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{return NextResponse.json({user:await currentUser(req)})}catch{return NextResponse.json({user:null})}}
