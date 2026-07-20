@echo off
echo Starting Data Editor Server...
start "" "http://localhost:8080/editor/index.html"
node editor/server.js
