from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
os.chdir(r'C:\Users\LaDark\Desktop\Cougar')
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  name=self.path.split('?')[0].lstrip('/')
  if name in ['STEP1.html','STEP2.html','STEP3.html']:
   s=Path(name).read_text(encoding='utf-8')
   s=s.replace('<head>','<head><script src="/tmp/update-photos/demo.js"></script>')
   data=s.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(data)
  else: super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8772),Handler).serve_forever()
