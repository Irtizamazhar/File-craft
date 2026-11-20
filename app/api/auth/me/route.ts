import {NextRequest,NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {unexpected} from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{return NextResponse.json({user:await currentUser(req)},{headers:{'Cache-Control':'no-store'}})}catch(e){return unexpected(e)}}
