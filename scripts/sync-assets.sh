#!/bin/sh
# Fix TailwindCSS v4 hash mismatch between Vite server and client builds.
# Also fixes server-to-server hash mismatches (serverFn referencing missing schema files).

SERVER_DIR="dist/server"
CLIENT_DIR="dist/client/assets"

# ── Pass 1: Client → Server ───────────────────────────────────────────────────
SED_SCRIPT=""

for client_file in "$CLIENT_DIR"/*; do
  [ -f "$client_file" ] || continue
  client_name=$(basename "$client_file")
  ext="${client_name##*.}"
  base=$(echo "$client_name" | sed "s/\(.*\)-[^-]*\.${ext}$/\1/")
  server_ref=$(grep -roh "${base}-[A-Za-z0-9_-]*\.${ext}" "$SERVER_DIR/assets/" 2>/dev/null | sort -u | head -1)
  if [ -n "$server_ref" ] && [ "$server_ref" != "$client_name" ]; then
    SED_SCRIPT="${SED_SCRIPT}s|${server_ref}|${client_name}|g;"
    echo "Pass1 patch: $server_ref -> $client_name"
  fi
done

if [ -n "$SED_SCRIPT" ]; then
  for server_file in "$SERVER_DIR"/assets/*.js "$SERVER_DIR"/server.js; do
    [ -f "$server_file" ] || continue
    sed -i "$SED_SCRIPT" "$server_file"
  done
  echo "Pass1: Patched all server files."
else
  echo "Pass1: No client->server mismatches found."
fi

# ── Pass 2: Server → Server ───────────────────────────────────────────────────
# Fix broken imports inside server bundles that reference missing hashed files.
echo "Pass2: Checking for broken server-to-server module references..."

SED_SCRIPT2=""

existing_files=$(ls "$SERVER_DIR/assets/"*.js 2>/dev/null | xargs -I{} basename {})

for server_file in "$SERVER_DIR"/assets/*.js "$SERVER_DIR"/server.js; do
  [ -f "$server_file" ] || continue

  refs=$(grep -oh '[a-zA-Z][a-zA-Z0-9_-]*-[A-Za-z0-9_-]\{8,\}\.js' "$server_file" 2>/dev/null | sort -u)

  for ref in $refs; do
    if ! echo "$existing_files" | grep -qx "$ref"; then
      ext="${ref##*.}"
      base=$(echo "$ref" | sed "s/\(.*\)-[^-]*\.${ext}$/\1/")
      replacement=$(echo "$existing_files" | grep "^${base}-" | head -1)
      if [ -n "$replacement" ] && [ "$replacement" != "$ref" ]; then
        SED_SCRIPT2="${SED_SCRIPT2}s|${ref}|${replacement}|g;"
        echo "Pass2 patch: $ref -> $replacement"
      else
        echo "Pass2 WARNING: missing $ref, no replacement found for base '$base'"
      fi
    fi
  done
done

if [ -n "$SED_SCRIPT2" ]; then
  for server_file in "$SERVER_DIR"/assets/*.js "$SERVER_DIR"/server.js; do
    [ -f "$server_file" ] || continue
    sed -i "$SED_SCRIPT2" "$server_file"
  done
  echo "Pass2: Patched broken server references."
else
  echo "Pass2: No broken server references found."
fi

echo "Asset sync complete."
