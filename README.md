# Neurwerk Keycloak Theme

A small native Keycloak theme for Neurwerk's user-facing authentication pages
and emails. White surfaces, Inter typography, indigo accents, slightly rounded
corners, and text controls instead of decorative icons.

## Scope

- Login, password recovery, verification, required actions, MFA, and other
  authentication pages inherit Keycloak's current forms and behavior.
- HTML emails use a branded wrapper. Action content, expiry information,
  translations, and plain-text alternatives remain upstream.
- Account, Admin, and Welcome consoles are not themed. Selecting a realm login
  theme also affects administrators who sign in through that realm; it does not
  change the Admin Console itself.
- No authentication policy, registration setting, OIDC flow, or SMTP configuration
  is changed by installing the theme.

The theme is named `neurwerk`. Login extends `keycloak.v2`; email extends
`keycloak`. The only FreeMarker overrides are the login footer and HTML email
layout. No login forms, upstream JavaScript, action emails, or text emails are
copied. English, German, and Dutch branding bundles supplement upstream messages.
The theme intentionally uses light mode, even if the OS prefers dark mode.

## Local Preview

Requires Docker with Compose v2 and the Node version in `.tool-versions` (via
mise). The preview is disposable and binds host ports only to loopback.

```bash
mise exec -- docker compose up --build --wait --wait-timeout 300
```

- [Open the login preview](http://localhost:8080/realms/neurwerk/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback&response_type=code&scope=openid)
- Mailpit inbox: <http://localhost:8025>
- Preview user: `theme-user`, password `Preview-only-123!`
- Preview Admin Console: <http://localhost:8080/admin/>, username `preview-admin`,
  password `Disposable-preview-admin-123!`

These are public synthetic test credentials, never production credentials.
Registration is enabled only in the preview realm. Successful login redirects to
an intentionally unimplemented `/callback` URL with an authorization code; a 404
there is expected. This is an authentication preview, not an OIDC application.

```bash
mise exec -- docker compose down
```

No persistent volumes are created. Removing the preview containers removes its
users, messages, and enrollment state. Rebuild/recreate after changing the theme;
the preview exercises the same baked-in assets as the image, not a live mount.
Never use this Compose setup or its `start-dev` command in production.

## Checks

```bash
mise exec -- npm ci
mise exec -- make check
mise exec -- npx playwright install --with-deps chromium
# Start the disposable preview before integration checks.
mise exec -- make integration
```

`make check` guards theme inheritance, the limited override surface, local asset
references, branding message bundles, and the preview contract. Integration checks
use real Keycloak and Mailpit instances at fixed localhost addresses. They create
isolated synthetic users and remove those users afterward.

The Chromium suite covers desktop and mobile layout, password visibility,
invalid/valid login, authorization-code return, keyboard navigation, en/de/nl,
password-reset email and completion, required email verification, and OTP
enrollment followed by MFA login. Screenshots and a browser report are available
in `test-results/` and `playwright-report/`, or CI's `browser-preview` artifact.
Artifacts contain disposable test data only and expire after seven days in CI.

Screenshot review is not a pixel-baseline test. WebAuthn hardware, registration,
expired links, screen-reader behavior, non-Chromium browsers, and actual email
clients require additional review before production adoption. Email layout uses
inline styles and a textual wordmark so it remains readable with images blocked;
rounded corners and link styling may vary between email clients.

## Packaging And Releases

Current theme version: `0.1.0` in `VERSION`. Target Keycloak: `26.7.2`.

The Dockerfile extends `quay.io/keycloak/keycloak:26.7.2`, pinned by digest, and adds files under
`/opt/keycloak/themes/neurwerk/`. It preserves upstream startup behavior, caching,
user, entrypoint, and database handling. It does not run an optimized build or add
providers. Test and update the theme alongside every Keycloak version change.

Main pushes run static, image-build, and integration validation. The initial
repository bootstrap is authorized to push directly to `main` without a PR;
validation still applies. This exception does not change other repositories'
review or release rules.

Image publication is a separate, explicitly authorized action: pushing `vX.Y.Z`
must match `VERSION` exactly and pass the validation workflow. The release workflow
publishes only `linux/amd64` to:

```text
ghcr.io/neurwerk/k8s-stack-keycloak-theme:X.Y.Z
```

It does not publish `latest`. Do not reuse a released version or move release
tags. Verify the resulting image digest before pinning it in the platform.
No image has been published or adopted as part of this bootstrap.

## Platform Integration

Installing assets and selecting a theme are separate operations. For a managed
realm, future coordinated changes must:

1. Publish and verify the theme image.
2. Add the supported image pin and theme-value contract in `base/`.
3. Add declarative `loginTheme` / `emailTheme` selection in `tooling/`, explicitly
   defining omission and reset behavior.
4. Adopt the reviewed platform change in the intended client after authorization.

Do not configure managed production realms manually or select the theme before
all serving instances contain it. To revert branding, first select the upstream
login/email themes through managed configuration while the custom image is still
available; only then remove the image/theme assets. Theme rollback is not a
database or Keycloak-version rollback.

## Branding And Licences

The palette, logo, favicon, and bundled Inter fonts come from
<https://www.neurwerk.com/>. See [THIRD_PARTY.md](THIRD_PARTY.md) for asset sources,
checksums, and licence boundaries.

Original theme code is MIT licensed. Inter is SIL OFL 1.1; Neurwerk trademarks
and brand assets are not licensed by the code licence. Upstream Keycloak retains
its Apache 2.0 licence and notices. DKForge was visual inspiration only; no
DKForge code or assets are included.

The discreet "Powered by Keycloak" link is voluntary attribution, not a required
login-screen badge. It is defined in `login/footer.ftl` and the email wrapper.
