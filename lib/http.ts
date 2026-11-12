import {NextResponse} from 'next/server';
export function failJson(message:string,status=400){return NextResponse.json({error:message},{status})}
export function unexpected(error:unknown){console.error('FileCraft request failed:',error instanceof Error?error.message:'Unknown error');return failJson('Service temporarily unavailable. Please try again later.',503)}
