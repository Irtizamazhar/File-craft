import {readFileSync} from 'node:fs';
import mysql from 'mysql2/promise';
const url=process.env.DATABASE_URL;
if(!url){console.error('DATABASE_URL missing. Create your .env.local or set environment variables.');process.exit(1)}
const conn=await mysql.createConnection({uri:url,multipleStatements:false});
try{const sql=readFileSync('sql/schema.sql','utf8').replace(/^--.*$/gm,'');for(const q of sql.split(';').map(x=>x.trim()).filter(Boolean)){await conn.query(q)}console.log('MySQL schema initialized successfully.')}finally{await conn.end()}
