import http.server
import socketserver
import os
import json
import uuid
from urllib.parse import urlparse, parse_qs

DB_FILE = 'db.json'

def load_db():
    if not os.path.exists(DB_FILE):
        return {"users": [], "listings": []}
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        try:
            parsed_url = urlparse(self.path)
            
            # Get content length safely
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                except json.JSONDecodeError as e:
                    print(f"JSON Decode Error: {e}")
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(f'Invalid JSON: {e}'.encode('utf-8'))
                    return
            else:
                data = {}

            db = load_db()
            response_data = {}
            status_code = 200

            print(f"Handling POST for {parsed_url.path}")

            # Login endpoint
            if parsed_url.path == '/api/auth/login':
                print(f"Login attempt for: {data.get('email')}")
                user = next((u for u in db['users'] if u['email'] == data.get('email') and u['password'] == data.get('password')), None)
                if user:
                    response_data = {'success': True, 'user': user}
                else:
                    status_code = 401
                    response_data = {'success': False, 'message': 'Invalid credentials'}
            
            # Signup endpoint
            elif parsed_url.path == '/api/auth/signup':
                 if any(u['email'] == data.get('email') for u in db['users']):
                     status_code = 400
                     response_data = {'success': False, 'message': 'Email already exists'}
                 else:
                     new_user = data
                     # In a real app, hash password here
                     db['users'].append(new_user)
                     save_db(db)
                     response_data = {'success': True, 'user': new_user}

            # Create Listing
            elif parsed_url.path == '/api/listings':
                print("Creating new listing...")
                new_listing = data
                new_listing['id'] = str(uuid.uuid4())
                new_listing['status'] = 'pending' # Default status
                new_listing['donors'] = []
                new_listing['progress'] = 0
                db['listings'].append(new_listing)
                save_db(db)
                print(f"Listing created with ID: {new_listing['id']}")
                response_data = {'success': True, 'listing': new_listing}

            # Approve Listing
            elif parsed_url.path.startswith('/api/listings/') and parsed_url.path.endswith('/approve'):
                listing_id = parsed_url.path.split('/')[3]
                listing = next((l for l in db['listings'] if l['id'] == listing_id), None)
                if listing:
                    listing['status'] = 'active' # 'active' = approved and visible to donors
                    save_db(db)
                    response_data = {'success': True, 'listing': listing}
                else:
                    status_code = 404
                    response_data = {'success': False, 'message': 'Listing not found'}

            # Reject Listing
            elif parsed_url.path.startswith('/api/listings/') and parsed_url.path.endswith('/reject'):
                listing_id = parsed_url.path.split('/')[3]
                listing = next((l for l in db['listings'] if l['id'] == listing_id), None)
                if listing:
                    listing['status'] = 'rejected'
                    listing['donors'] = []
                    listing['donations'] = []
                    save_db(db)
                    response_data = {'success': True, 'listing': listing}
                else:
                    status_code = 404
                    response_data = {'success': False, 'message': 'Listing not found'}
            
            # Match Listing (Donor swipes right)
            elif parsed_url.path.startswith('/api/listings/') and parsed_url.path.endswith('/match'):
                listing_id = parsed_url.path.split('/')[3]
                donor_id = data.get('donorId')
                
                if not donor_id:
                    status_code = 400
                    response_data = {'success': False, 'message': 'donorId is required'}
                else:
                    listing = next((l for l in db['listings'] if l['id'] == listing_id), None)
                    if listing:
                        if 'donors' not in listing:
                            listing['donors'] = []
                        if donor_id not in listing['donors']:
                            listing['donors'].append(donor_id)
                            save_db(db)
                        response_data = {'success': True, 'listing': listing}
                    else:
                        status_code = 404
                        response_data = {'success': False, 'message': 'Listing not found'}
            
            # Record Swipe (Left or Right)
            elif parsed_url.path.startswith('/api/listings/') and parsed_url.path.endswith('/swipe'):
                listing_id = parsed_url.path.split('/')[3]
                donor_id = data.get('donorId')
                
                if not donor_id:
                    status_code = 400
                    response_data = {'success': False, 'message': 'donorId is required'}
                else:
                    listing = next((l for l in db['listings'] if l['id'] == listing_id), None)
                    if listing:
                        if 'swipedBy' not in listing:
                            listing['swipedBy'] = []
                        if donor_id not in listing['swipedBy']:
                            listing['swipedBy'].append(donor_id)
                            save_db(db)
                        response_data = {'success': True, 'listing': listing}
                    else:
                        status_code = 404
                        response_data = {'success': False, 'message': 'Listing not found'}
            
            # Record Donation (Update Progress)
            elif parsed_url.path.startswith('/api/listings/') and parsed_url.path.endswith('/donate'):
                listing_id = parsed_url.path.split('/')[3]
                donor_id = data.get('donorId')
                amount = data.get('amount', 0)
                
                listing = next((l for l in db['listings'] if l['id'] == listing_id), None)
                if listing:
                    # Increment progress (simulated)
                    current_progress = listing.get('progress', 0)
                    new_progress = min(100, current_progress + 10) # Increment by 10% for demo
                    listing['progress'] = new_progress
                    
                    if 'donations' not in listing:
                        listing['donations'] = []
                    
                    listing['donations'].append({
                        'donorId': donor_id,
                        'amount': amount,
                        'timestamp': data.get('timestamp')
                    })
                    
                    # Move from matches to donated: Remove from 'donors' list if they were matched
                    if 'donors' in listing and donor_id in listing['donors']:
                        listing['donors'].remove(donor_id)
                    
                    save_db(db)
                    response_data = {'success': True, 'progress': new_progress}
                else:
                    status_code = 404
                    response_data = {'success': False, 'message': 'Listing not found'}
            
            else:
                status_code = 404
                response_data = {'error': 'Not Found'}

            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        
        except Exception as e:
            print(f"SERVER ERROR: {e}")
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Internal Server Error: {str(e)}".encode('utf-8'))

    def do_GET(self):
        parsed_url = urlparse(self.path)
        
        if parsed_url.path.startswith('/api/'):
            db = load_db()
            response_data = {}
            status_code = 200

            if parsed_url.path == '/api/listings':
                query_params = parse_qs(parsed_url.query)
                status_filter = query_params.get('status', [None])[0]
                recipient_id = query_params.get('recipientId', [None])[0]
                donor_id = query_params.get('donorId', [None])[0]
                matches_only = query_params.get('matchesOnly', [None])[0]
                
                listings = db['listings']
                
                if status_filter:
                    listings = [l for l in listings if l.get('status') == status_filter]
                
                if recipient_id:
                     listings = [l for l in listings if l.get('recipientId') == recipient_id]

                if donor_id:
                     if matches_only == 'true':
                         listings = [l for l in listings if donor_id in l.get('donors', [])]
                     elif query_params.get('donatedOnly', [None])[0] == 'true':
                         listings = [l for l in listings if any(d.get('donorId') == donor_id for d in l.get('donations', []))]
                     else:
                         listings = [l for l in listings if donor_id not in l.get('swipedBy', [])]

                response_data = listings
            
            else:
                status_code = 404
                response_data = {'error': 'Not Found'}

            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        # Default static file handling
        path = parsed_url.path
        if path == "/":
            path = "/index.html"
            
        try:
            _, ext = os.path.splitext(path)
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

            if ext in mime_types:
                if os.path.exists('.' + path): # Check current dir
                    self.send_response(200)
                    self.send_header('Content-type', mime_types[ext])
                    self.end_headers()
                    with open('.' + path, 'rb') as file:
                        self.wfile.write(file.read())
                else:
                    self.send_error(404, "File not found")
            else:
                 # fallback
                 return http.server.SimpleHTTPRequestHandler.do_GET(self)

        except FileNotFoundError:
            self.send_error(404, "File not found")

    def do_DELETE(self):
        try:
            parsed_url = urlparse(self.path)
            
            if parsed_url.path.startswith('/api/listings/'):
                listing_id = parsed_url.path.split('/')[3]
                db = load_db()
                
                initial_count = len(db['listings'])
                db['listings'] = [l for l in db['listings'] if l.get('id') != listing_id]
                
                if len(db['listings']) < initial_count:
                    save_db(db)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'message': 'Listing deleted'}).encode('utf-8'))
                else:
                    self.send_response(404)
                    self.end_headers()
                    self.wfile.write(b'Listing not found')
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'Not Found')
        
        except Exception as e:
            print(f"SERVER ERROR: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

def run_server(port=8000):
    try:
        handler = MyHttpRequestHandler
        # Allow reusing address to avoid "Address already in use" errors on restart
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"Server started at http://localhost:{port} (v2 - Debug Mode)")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:
            print(f"Port {port} is already in use. Trying port {port + 1}")
            run_server(port + 1)
        else:
            raise e

if __name__ == "__main__":
    run_server() 