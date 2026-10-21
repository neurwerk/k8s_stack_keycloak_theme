# Development

## Build and checks

Run commands from the repository root. Image building requires Docker with access to the base image in [Dockerfile](../../Dockerfile) and support for `linux/amd64`. There is no Node.js dependency installation, Makefile, or repository test runner. The [validation workflow](../../.github/workflows/validate.yaml) runs this image build:

```bash
docker build --platform linux/amd64 .
```

The build copies files; it does not render FreeMarker or verify browser behavior. After template or CSS changes, use the preview below to inspect sign-in, validation errors, password recovery, and affected inherited pages at desktop and narrow widths. Review upstream template changes when updating the Keycloak base image, especially inherited macros and session/resource hooks.

## Disposable preview

Docker Compose v2 and available local ports `8080` and `8025` are required. [`compose.yaml`](../../compose.yaml) builds the theme image, starts Keycloak in development mode, and imports [`preview/realm.json`](../../preview/realm.json). Mailpit captures email inside the Compose network. Both browser ports bind to loopback; no persistent volumes are configured.

```bash
docker compose config --quiet
docker compose up --build --wait
```

Open this authorization URL to render the selected login theme:

```text
http://localhost:8080/realms/neurwerk/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F&response_type=code&scope=openid
```

The client exists to exercise authentication, not to implement an application callback. Use the synthetic users and passwords defined in `preview/realm.json`; the local administrator credentials are defined in `compose.yaml`. Do not substitute real identities into this fixture.

| Preview user | Page or flow |
| --- | --- |
| `theme-user` | Normal sign-in and password recovery |
| `theme-otp` | TOTP setup |
| `theme-password` | Required password update |
| `theme-profile` | Required profile update |
| `theme-verify` | Email verification |
| `theme-recovery` | Recovery-code setup |

Use a fresh browser session to begin another user's flow. Append `&kc_locale=de` or `&kc_locale=nl` to the authorization URL to inspect translated pages without a locale picker. Open `http://localhost:8025` to inspect recovery and verification email; inspect HTML and plain-text parts.

Theme files are copied into the image rather than bind-mounted. Re-run `docker compose up --build --wait` after theme changes. Realm import does not overwrite an existing realm; to reload fixture changes or reset completed actions, remove and recreate this disposable preview:

```bash
docker compose down
docker compose up --build --wait
```

Run `docker compose down` when finished. This removes the preview containers and their disposable state.
