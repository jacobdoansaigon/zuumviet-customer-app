#!/usr/bin/env bash
# Chép client API (sinh tự động từ zuumviet-platform) vào services/zuum-api.ts — KHÔNG sửa tay file đó.
# Dùng: ./scripts/sync-api-client.sh   (hoặc ZUUM_PLATFORM_DIR=/đường/dẫn/zuumviet-platform ./scripts/sync-api-client.sh)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM_DIR="${ZUUM_PLATFORM_DIR:-$APP_DIR/../../zuumviet-platform}"
SRC="$PLATFORM_DIR/packages/api-client/src/zuum-api.ts"
DEST="$APP_DIR/services/zuum-api.ts"

if [ ! -f "$SRC" ]; then
  echo "Không tìm thấy $SRC — đặt ZUUM_PLATFORM_DIR trỏ tới repo zuumviet-platform" >&2
  exit 1
fi

cp "$SRC" "$DEST"
echo "Đã chép $SRC → services/zuum-api.ts"
if command -v git >/dev/null 2>&1 && git -C "$PLATFORM_DIR" rev-parse --short HEAD >/dev/null 2>&1; then
  echo "zuumviet-platform @ $(git -C "$PLATFORM_DIR" rev-parse --short HEAD)"
fi
