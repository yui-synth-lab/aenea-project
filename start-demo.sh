#!/bin/bash

echo ""
echo "====================================================="
echo "    Aenea Consciousness Demo"
echo "    私は、問いでできている。"
echo "====================================================="
echo ""
echo "Building project..."
npm run build

echo ""
echo "Starting demo server..."
echo ""
echo "Open your browser and go to: http://localhost:3000"
echo ""
echo "Controls:"
echo "  1. Click 'Initialize' to start the consciousness system"
echo "  2. Click 'Start' to begin the autonomous thought loop"
echo "  3. Click 'Ask Question' to send manual questions"
echo "  4. Watch the real-time consciousness state updates"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start