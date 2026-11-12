import {adsensePublisher} from '@/lib/site';
export function GET() {
  const id=adsensePublisher.replace('ca-pub-','pub-');
  const content=id ? `google.com, ${id}, DIRECT, f08c47fec0942fa0\n` : '# AdSense publisher ID not configured. No authorized sellers declared.\n';
  return new Response(content,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});
}
