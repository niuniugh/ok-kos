#!/bin/sh
# Fix TailwindCSS v4 hash mismatch between Vite server and client builds.
# The server build references asset hashes that differ from client build.
# This script patches all server JS files to use client asset filenames.

SERVER_DIR="dist/server"
CLIENT_DIR="dist/client/assets"

# Build mapping: for each client asset, find its server counterpart
# Client files: main-DPxmy8yo.js, styles-C9JCxbmf.css, etc.
# Server references: main-BmPfhchm.js, styles-BiX_ESPp.css, etc.
# Match by base name prefix (e.g. "main", "styles", "button", etc.)

SED_SCRIPT=""

for client_file in "$CLIENT_DIR"/*; do
  [ -f "$client_file" ] || continue
  client_name=$(basename "$client_file")
  ext="${client_name##*.}"

  # Extract base: everything before the last dash-hash segment
  # e.g. "alert-dialog-BJ3HRLZc.js" -> base is "alert-dialog"
  base=$(echo "$client_name" | sed "s/\(.*\)-[^-]*\.${ext}$/\1/")

  # Find the server reference with same base
  server_ref=$(grep -roh "${base}-[A-Za-z0-9_]*\.${ext}" "$SERVER_DIR/assets/" 2>/dev/null | sort -u | head -1)

  if [ -n "$server_ref" ] && [ "$server_ref" != "$client_name" ]; then
    SED_SCRIPT="${SED_SCRIPT}s|${server_ref}|${client_name}|g;"
    echo "Will patch: $server_ref -> $client_name"
  fi
done

if [ -n "$SED_SCRIPT" ]; then
  # Apply all replacements in a single pass to avoid cascading
  for server_file in "$SERVER_DIR"/assets/*.js "$SERVER_DIR"/server.js; do
    [ -f "$server_file" ] || continue
    sed -i "$SED_SCRIPT" "$server_file"
  done
  echo "Patched all server files."
else
  echo "No mismatches found."
fi

echo "Asset sync complete."
