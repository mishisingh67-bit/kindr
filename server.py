import http.server
import socketserver
import os
from urllib.parse import urlparse

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # Default to index.html for root path
        if path == "/":
            path = "/index.html"

        try:
            # Get the file extension
            _, ext = os.path.splitext(path)
            
            # Map file extensions to MIME types
            mime_types = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif'
            }

            # Set the correct MIME type
            if ext in mime_types:
                self.send_response(200)
                self.send_header('Content-type', mime_types[ext])
                # Add CORS headers
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                # Serve the file
                with open('.' + path, 'rb') as file:
                    self.wfile.write(file.read())
            else:
                # For unknown file types, let the parent class handle it
                return http.server.SimpleHTTPRequestHandler.do_GET(self)
                
        except FileNotFoundError:
            # Handle 404 errors gracefully
            self.send_response(404)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('404.html', 'rb') if os.path.exists('404.html') else None as error_page:
                if error_page:
                    self.wfile.write(error_page.read())
                else:
                    self.wfile.write(b"404 - Page not found")

    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server(port=8000):
    try:
        handler = MyHttpRequestHandler
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"Server started at http://localhost:{port}")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:  # Port already in use
            print(f"Port {port} is already in use. Trying port {port + 1}")
            run_server(port + 1)
        else:
            raise e

if __name__ == "__main__":
    run_server() 