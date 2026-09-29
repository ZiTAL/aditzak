# Debian home-server deployment prompt

Copy and paste the following prompt into the LLM agent running on the Debian
server:

---

Deploy the Aditzak application on this Debian home server.

## Target state

- Repository: <https://github.com/ZiTAL/aditzak.git>
- Installation directory: `/home/projects/aditzak`
- Run with rootless Podman and Podman Compose.
- Expose the complete application through a single port: `8006`.
- Make it reachable from the local network at
  `http://SERVER_LAN_IP:8006`.
- Do not expose the API container directly. Its port `3000` must remain private.
- Do not expose port `8080` on the host.
- Do not expose the service to the public Internet.
- Configure automatic startup after a server reboot.
- Use the published database Release instead of rebuilding the database from
  source.

## Important network constraints

This server does not use Zscaler, a corporate proxy, TLS inspection, or a
custom CA.

Therefore:

- Do not use `docker/compose.ca.yaml`.
- Do not create `compose.override.yaml`.
- Do not configure `BUILD_CA_FILE` or `NODE_EXTRA_CA_CERTS`.
- Do not disable TLS certificate validation.
- Do not install or copy any Zscaler certificate.
- Do not modify the system certificate store.
- Use the normal public CA certificates included with Debian.
- If `HTTP_PROXY`, `HTTPS_PROXY`, or `ALL_PROXY` variables are unexpectedly
  configured, report them and avoid applying global system changes.

## Database Release

Use this immutable database asset:

```dotenv
DATABASE_RELEASE_URL=https://github.com/ZiTAL/aditzak/releases/download/db-v0.1.0/aditzak.sqlite.zst
DATABASE_RELEASE_SHA256=78be2ba89e376c5b4dc872a19a584ff8b52951f0ff25f8dd90f166f53c0864c3
```

The Release is public and the database coverage must report `complete: true`.

## Safety requirements

- Work as the intended non-root service user.
- Do not run the containers with `sudo` or as root.
- Use `sudo` only when installing Debian packages, preparing `/home/projects`,
  or enabling linger.
- If the current shell is root, ask which non-root account should own and run
  the service.
- Preserve existing files.
- If `/home/projects/aditzak` already exists and has uncommitted changes, stop
  and report them. Do not overwrite or delete them.
- Update an existing clean clone using `git pull --ff-only`.
- Do not use destructive Git commands.
- Check that port `8006` is free before starting.
- Check that sufficient disk space is available.
- Do not change firewall rules without asking first.
- If the server has a directly reachable public interface, stop before binding
  to `0.0.0.0` and ask for confirmation. The intended exposure is LAN-only.

## Implementation steps

1. Inspect the Debian version, current user, available disk space, network
   interfaces, firewall state, and whether port `8006` is already in use.

2. Install only the required packages if missing:

   - `git`
   - `curl`
   - `ca-certificates`
   - `jq`
   - `podman`
   - `podman-compose`
   - `dbus-user-session`
   - `uidmap`
   - `slirp4netns`
   - `fuse-overlayfs`

3. Verify that rootless Podman works:

   ```sh
   podman info
   podman compose version
   ```

   Do not continue with rootful Podman as a fallback.

4. Clone or safely update the repository at:

   ```text
   /home/projects/aditzak
   ```

   Use the `main` branch and report the exact deployed commit.

5. Create `/home/projects/aditzak/docker/.env` with exactly these deployment
   values:

   ```dotenv
   WEB_BIND_ADDRESS=0.0.0.0
   WEB_PORT=8006
   DATABASE_RELEASE_URL=https://github.com/ZiTAL/aditzak/releases/download/db-v0.1.0/aditzak.sqlite.zst
   DATABASE_RELEASE_SHA256=78be2ba89e376c5b4dc872a19a584ff8b52951f0ff25f8dd90f166f53c0864c3
   ```

   Do not add proxy or custom CA variables.

6. Validate the Compose configuration from the `docker` directory using only:

   - `compose.yaml`
   - `compose.release.yaml`

   Do not include `compose.ca.yaml` or any override file.

7. Build the images using:

   ```sh
   cd /home/projects/aditzak/docker
   podman compose \
     -f compose.yaml \
     -f compose.release.yaml \
     build
   ```

   The build must verify the database SHA-256 checksum, SQLite integrity, and
   `complete: true`. Do not bypass any verification if the build fails.

8. Configure a user-level systemd service for the non-root service account.

   Create:

   ```text
   ~/.config/systemd/user/aditzak.service
   ```

   Use an equivalent of:

   ```systemd
   [Unit]
   Description=Aditzak application
   Wants=network-online.target
   After=network-online.target

   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/home/projects/aditzak/docker
   Environment=PATH=/usr/local/bin:/usr/bin:/bin
   ExecStart=/usr/bin/podman compose -f compose.yaml -f compose.release.yaml up -d --no-build
   ExecStop=/usr/bin/podman compose -f compose.yaml -f compose.release.yaml down
   TimeoutStartSec=0

   [Install]
   WantedBy=default.target
   ```

   Confirm the absolute path to Podman before writing the unit and adjust it if
   it is not `/usr/bin/podman`.

9. Enable lingering for the non-root service account so the user service starts
   without an interactive login. Then enable and start the unit:

   ```sh
   systemctl --user daemon-reload
   systemctl --user enable --now aditzak.service
   ```

10. Wait for both containers to become healthy. Diagnose failures using:

    ```sh
    podman compose -f compose.yaml -f compose.release.yaml ps
    podman compose -f compose.yaml -f compose.release.yaml logs
    ```

11. Verify all of the following:

    ```sh
    curl --fail http://127.0.0.1:8006/
    curl --fail http://127.0.0.1:8006/health
    curl --fail http://127.0.0.1:8006/api/v1/meta
    curl --fail 'http://127.0.0.1:8006/api/v1/analyze?form=hatzait'
    ```

    Confirm that:

    - the frontend returns HTTP 200;
    - `/health` returns `status: ok`;
    - `/api/v1/meta` returns `complete: true`;
    - the database contains 413136 forms and 665577 analyses;
    - `hatzait` returns at least one analysis;
    - the host listens on port `8006`;
    - the host does not listen on ports `3000` or `8080` for this application;
    - both containers are healthy;
    - the systemd user service is enabled and active.

12. Determine the server's private LAN address and report the final URL as:

    ```text
    http://PRIVATE_LAN_IP:8006
    ```

    If an active firewall blocks LAN access to port `8006`, show the exact
    LAN-restricted firewall rule that would be needed and ask before applying
    it.

13. Do not stop after merely writing configuration files. Continue until the
    application is running, healthy, enabled for reboot, and verified.

## Final report

Provide a concise report containing:

- deployed Git commit;
- installation directory;
- database Release and checksum;
- LAN URL;
- container status;
- systemd service status;
- verification results;
- whether any firewall action is still required;
- any warnings or manual steps that remain.
