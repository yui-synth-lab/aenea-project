#!/bin/bash
echo "Waiting for database to be created..."
sleep 2
if [ -f "./data/aenea_consciousness.db" ]; then
  echo "Database found. Checking unresolved_ideas..."
  sqlite3 ./data/aenea_consciousness.db "SELECT COUNT(*) FROM unresolved_ideas;"
  echo "Sample questions:"
  sqlite3 ./data/aenea_consciousness.db "SELECT question, category FROM unresolved_ideas LIMIT 5;"
else
  echo "Database not found yet"
fi
