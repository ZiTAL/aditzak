# Deployment with a GitHub Release database

The production workflow keeps the application code separate from the SQLite
artifact. The database is an immutable, compressed asset attached to a GitHub
Release. During the build, the API OCI image downloads it, verifies its SHA-256
checksum, decompresses it, and runs `PRAGMA integrity_check`. The Deno process
does not need network access to obtain the database at runtime.

## 1. Prepare a draft Release

In GitHub, go to **Actions → Prepare database release → Run workflow** and enter
a tag such as `db-v0.1.0`. The workflow:

1. builds the database from pinned sources;
2. runs the tests and all four coverage audits;
3. verifies SQLite integrity and `complete: true`;
4. compresses the assets and generates SHA-256 checksums;
5. creates a GitHub Release in **draft** state.

The workflow never publishes the Release automatically. Review the draft and
use GitHub's **Publish release** action manually.

The assets are:

- `aditzak.sqlite.zst`: the compressed, immutable production database;
- `coverage.json`: the coverage summary;
- `SHA256SUMS`: cryptographic hashes for the three content assets;
- `aditzak-database-source.tar.zst`: the code, redistributable data sources,
  licenses, and scripts required to rebuild the database.

The Euskaltzaindia PDFs are downloaded for auditing, but they are not
redistributed in the Release.

To prepare the same assets locally without creating a Release:

```sh
npm run data:fetch
npm run data:build
npm run data:release:package -- /tmp/aditzak-release db-v0.1.0
```

The output directory must be empty so that an existing asset cannot be
silently overwritten. The Git working tree must also be clean; this guarantees
that the source archive and database come from the same commit.

## 2. Build and start with a pinned Release

Copy the hash from the `aditzak.sqlite.zst` line in the published Release's
`SHA256SUMS` file. Set the following values in `docker/.env`:

```dotenv
WEB_BIND_ADDRESS=127.0.0.1
WEB_PORT=8006
DATABASE_RELEASE_URL=https://github.com/ZiTAL/aditzak/releases/download/db-v0.1.0/aditzak.sqlite.zst
DATABASE_RELEASE_SHA256=REPLACE_WITH_THE_64_CHARACTER_SHA256
```

Then run:

```sh
cd docker
podman compose -f compose.yaml -f compose.release.yaml up --build -d
podman compose -f compose.yaml -f compose.release.yaml ps
curl --fail http://127.0.0.1:8006/health
curl --fail http://127.0.0.1:8006/api/v1/meta
```

`compose.release.yaml` immediately rejects a deployment with a missing URL or
checksum. The Containerfile also rejects an incorrect checksum, a corrupt
SQLite database, or a database whose coverage metadata is not
`complete: true`.

No proxy or custom CA configuration is required on a normal server. If a
corporate TLS inspection proxy requires a custom CA, explicitly add the
optional override:

```sh
podman compose \
  -f compose.yaml \
  -f compose.release.yaml \
  -f compose.ca.yaml \
  up --build -d
```

Do not use `compose.ca.yaml` on a server without such a proxy.

## 3. Updates and rollbacks

To deploy a new database, change both variables to the new Release URL and
checksum, then run `up --build -d` again. The new API image will contain the
new database; the web image is built independently of the database.

To roll back, restore the previous Release URL and checksum and run the same
command. The URL uses an exact tag, and the SHA-256 checksum pins its contents.
Do not use a mutable `latest/download` URL.

## 4. Local fallback

When both `DATABASE_RELEASE_URL` and `DATABASE_RELEASE_SHA256` are empty, the
base `compose.yaml` workflow builds the database from its sources. Providing
only one of the two values is an error.

```sh
cd docker
podman compose up --build -d
```

## 5. Network exposure

The current Compose configuration exposes the frontend, API, and `/health`
through a single entry point: `127.0.0.1:8006`. The API container's port `3000`
is available only inside the private Compose network. To access port `8006`
directly from the LAN, set `WEB_BIND_ADDRESS=0.0.0.0` in `docker/.env`.

There are two options for a public production deployment:

- route the server's external reverse proxy/TLS layer to
  `127.0.0.1:8006`; or
- configure Caddy with a real domain and publish ports 80 and 443.

The second option should not be enabled automatically until the domain and the
server's network model have been chosen.
