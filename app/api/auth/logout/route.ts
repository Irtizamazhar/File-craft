import {NextRequest,NextResponse} from 'next/server';
import {COOKIE,cookieOpts,endSession,validOrigin} from '@/lib/auth';
import {failJson} from '@/lib/http';
export const runtime='nodejs';
export async function POST(req:NextRequest){if(!validOrigin(req))return failJson('Invalid origin.',403);try{const token=req.cookies.get(COOKIE)?.value;if(token)await endSession(token)}catch{}const res=NextResponse.json({ok:true});res.cookies.set(COOKIE,'',{...cookieOpts,maxAge:0});return res}
