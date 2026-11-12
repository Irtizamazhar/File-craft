import mysql, {type Pool} from 'mysql2/promise';
let pool:Pool|undefined;
export function database():Pool {
 const uri=process.env.DATABASE_URL;
 if(!uri||uri.includes('db_user')||uri.includes('db_password'))throw new Error('MySQL is not configured. Set DATABASE_URL in Hostinger or .env.local.');
 if(!pool)pool=mysql.createPool({uri,waitForConnections:true,connectionLimit:6,maxIdle:3,idleTimeout:30000,queueLimit:20,enableKeepAlive:true});
 return pool;
}
