import {NextResponse,type NextRequest} from 'next/server';

// Vulnerability scanners probe these paths constantly. Answer with a cheap 404 before they reach
// the dynamic [section] route, so they never trigger page rendering or fill the ISR cache.
const PROBE_PREFIX=/^\/(?:wp-admin|wp-login|wp-content|wp-includes|wp-json|wordpress|wp|xmlrpc|phpmyadmin|pma|myadmin|cgi-bin|vendor\/phpunit|\.env|\.git|\.svn|\.hg|\.aws|\.ssh|\.vscode|\.idea|\.DS_Store|server-status|actuator|boaform|HNAP1)(?:[/.]|$)/i;
const PROBE_EXTENSION=/\.(?:php\d?|phtml|asp|aspx|jsp|cgi|pl|sql|bak|old|swp|ini|env|log)$/i;

export function middleware(request:NextRequest){
  const path=request.nextUrl.pathname;
  if(PROBE_PREFIX.test(path)||PROBE_EXTENSION.test(path)){
    return new NextResponse('Not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  }
  return NextResponse.next();
}

export const config={
  // Skip framework assets, API routes and the large static model/engine files.
  matcher:['/((?!_next/static|_next/image|api/|engines/|models/|licenses/|brand/).*)'],
};
