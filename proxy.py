#!/usr/bin/env python3
"""
Proxy simple que modifica el User-Agent para bypasear ngrok browser warning
"""

import http.server
import socketserver
import socket
import urllib.request
import urllib.error
import urllib.parse

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        # URL destino
        path = self.path
        query = ''
        if '?' in path:
            path, query = path.split('?', 1)

        target_url = f"http://localhost:8000{path}"
        if query:
            target_url += f"?{query}"

        try:
            # Crear request con User-Agent personalizado
            req = urllib.request.Request(target_url)

            # User-Agent que no es navegador (ngrok lo detecta)
            req.add_header('User-Agent', 'SCR-Agent-Proxy/1.0 (Custom-Client)')

            # Hacer request
            with urllib.request.urlopen(req, timeout=10) as response:
                # Enviar response
                self.send_response(response.status)

                # Copiar headers importantes
                for header, value in response.headers.items():
                    if header.lower() not in ['content-encoding', 'transfer-encoding', 'connection']:
                        self.send_header(header, value)

                self.end_headers()

                # Copiar contenido
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    self.wfile.write(chunk)

        except urllib.error.HTTPError as e:
            self.send_error(e.code, str(e))
        except socket.timeout:
            self.send_error(504, "Gateway Timeout")
        except Exception as e:
            self.send_error(502, f"Bad Gateway")

    def log_message(self, format, *args):
        # Simplified logging
        pass

if __name__ == '__main__':
    PORT = 8001
    Handler = ProxyHandler

    # Reuse address to avoid "Address already in use"
    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"✅ Proxy corriendo en http://localhost:{PORT}")
            print(f"   → Proxying to: http://localhost:8000")
            print(f"   → User-Agent: SCR-Agent-Proxy/1.0 (Custom-Client)")
            print(f"\n📡 Ngrok NO mostrará browser warning cuando expongas este puerto\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ Proxy detenido")
    except Exception as e:
        print(f"❌ Error: {e}")
