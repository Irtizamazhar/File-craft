'use client';
let pending:{slug:string;files:File[];expires:number}|undefined;
export function handoffFiles(slug:string,files:File[]){pending={slug,files,expires:Date.now()+5*60000}}
export function takeFiles(slug:string):File[]{const value=pending;pending=undefined;return value?.slug===slug&&value.expires>Date.now()?value.files:[]}
