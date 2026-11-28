const sellerRecord = 'google.com, pub-6568259874433864, DIRECT, f08c47fec0942fa0';

export function GET() {
  return new Response(sellerRecord + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
