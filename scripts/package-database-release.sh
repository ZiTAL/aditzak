#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_arg="${1:-$repo_root/dist/database-release}"
release_tag="${2:-db-local}"
database="$repo_root/data/generated/aditzak.sqlite"
coverage="$repo_root/data/generated/coverage.json"

if [[ ! "$release_tag" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Release etiketa baliogabea: $release_tag" >&2
  exit 1
fi
for command in git node sqlite3 tar zstd sha256sum; do
  command -v "$command" >/dev/null || { echo "$command komandoa falta da" >&2; exit 1; }
done
if [[ -n "$(git -C "$repo_root" status --porcelain --untracked-files=normal)" ]]; then
  echo "Release source artxiboa sortzeko Git lan-zuhaitzak garbi egon behar du" >&2
  exit 1
fi
[[ -f "$database" ]] || { echo "Datu-basea falta da: npm run data:fetch && npm run data:build" >&2; exit 1; }
[[ -f "$coverage" ]] || { echo "Estaldura-fitxategia falta da: $coverage" >&2; exit 1; }
[[ -f "$repo_root/data/vendor/apertium-eus/apertium-eus.eus.dix" ]] || {
  echo "Apertium iturria falta da: npm run data:fetch" >&2
  exit 1
}

mkdir -p "$output_arg"
output_dir="$(cd "$output_arg" && pwd)"
if find "$output_dir" -mindepth 1 -maxdepth 1 -print -quit | grep -q .; then
  echo "Irteera-direktorioa ez dago hutsik: $output_dir" >&2
  exit 1
fi

[[ "$(sqlite3 "$database" 'PRAGMA integrity_check;')" == "ok" ]] || {
  echo "SQLite integrity_check-ek huts egin du" >&2
  exit 1
}
[[ "$(sqlite3 "$database" "SELECT json_extract(value, '$.complete') FROM metadata WHERE key='coverage';")" == "1" ]] || {
  echo "Datu-baseak ez dauka complete: true" >&2
  exit 1
}
node -e "const c=require(process.argv[1]);if(c.complete!==true)throw Error('coverage.json: complete ez da true');" "$coverage"

temporary="$(mktemp -d)"
trap 'rm -rf -- "$temporary"' EXIT

zstd --threads=0 -12 --quiet --stdout "$database" > "$temporary/aditzak.sqlite.zst"
cp "$coverage" "$temporary/coverage.json"

source_prefix="aditzak-database-source-$release_tag"
git -C "$repo_root" archive --format=tar --prefix="$source_prefix/" HEAD -o "$temporary/source.tar"
tar --append --file="$temporary/source.tar" --transform="s,^,$source_prefix/," -C "$repo_root" \
  data/vendor/apertium-eus/apertium-eus.eus.dix \
  data/vendor/apertium-eus/COPYING \
  data/vendor/apertium-eus/AUTHORS
zstd --threads=0 -12 --quiet --stdout "$temporary/source.tar" > "$temporary/aditzak-database-source.tar.zst"

mv "$temporary/aditzak.sqlite.zst" "$output_dir/aditzak.sqlite.zst"
mv "$temporary/coverage.json" "$output_dir/coverage.json"
mv "$temporary/aditzak-database-source.tar.zst" "$output_dir/aditzak-database-source.tar.zst"
(
  cd "$output_dir"
  sha256sum aditzak.sqlite.zst coverage.json aditzak-database-source.tar.zst > SHA256SUMS
)

echo "Release assetak prest: $output_dir"
du -h "$output_dir"/*
