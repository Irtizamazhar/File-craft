import nextEnv from '@next/env';
import mysql from 'mysql2/promise';
nextEnv.loadEnvConfig(process.cwd());
let conn;
try{
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is not configured');
 conn=await mysql.createConnection({uri:process.env.DATABASE_URL,connectTimeout:10000});
 await conn.query('SELECT 1');
 const [[row]]=await conn.query('SELECT DATABASE() AS selected, VERSION() AS version');
 if(!row.selected)throw Error('No database selected');
 const [tables]=await conn.query('SHOW TABLES');
 const names=new Set(tables.map(row=>Object.values(row)[0]));
 for(const name of ['users','sessions','activity','contact_messages','subscription_plans','subscriptions']){
  if(!names.has(name))throw Error('Required table missing: '+name);
  const [indexes]=await conn.query('SHOW INDEX FROM '+name);
  console.log(name+': '+indexes.length+' index columns');
 }
 console.log('SELECT 1, selected database, required tables and indexes verified. Server: '+row.version);
}catch(error){console.error('Database verification FAILED: '+(error.code||error.message));process.exitCode=1}
finally{await conn?.end()}
