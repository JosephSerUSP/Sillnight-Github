const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.join(__dirname, '..');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/save') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const fileMap = {
                    creatures: 'creatures.js',
                    dungeons: 'dungeon.js',
                    events: 'events.js',
                    equipment: 'equipment.js',
                    items: 'items.js',
                    party: 'party.js',
                    skills: 'skills.js',
                    passives: 'passives.js',
                    materials: 'materials.js'
                };

                const type = data.type;
                const fileData = data.data;
                const fileName = fileMap[type];

                if (!fileName) {
                    res.writeHead(400);
                    res.end('Invalid type');
                    return;
                }

                const filePath = path.join(ROOT, 'src', 'assets', 'data', fileName);

                let fileContent = `export const ${type.charAt(0).toUpperCase() + type.slice(1)} = ${JSON.stringify(fileData, null, 4)};\n`;
                if(type === 'dungeons') {
                     fileContent = `export const Dungeons = ${JSON.stringify(fileData, null, 4)};\n`;
                }

                fs.writeFileSync(filePath, fileContent);

                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error(err);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // SANITIZE URL
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;

    // Prevent directory traversal
    pathname = pathname.replace(/^(\.\.[\/\\])+/, '');
    if (pathname.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    let filePath = path.join(ROOT, pathname === '/' ? '/editor/index.html' : pathname);
    if(pathname === '/editor' || pathname === '/editor/') {
        filePath = path.join(ROOT, 'editor/index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Bind ONLY to localhost to prevent external access
server.listen(PORT, '127.0.0.1', () => {
    console.log(`Editor server running at http://127.0.0.1:${PORT}/editor/index.html`);
});
