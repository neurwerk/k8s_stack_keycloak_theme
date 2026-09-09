# Neurwerk Keycloak Theme

A small native Keycloak theme for Neurwerk's user-facing authentication pages
and emails. The desktop login uses a white brand pane and indigo authentication
pane, with Inter typography, rounded controls, and native accessible icons.

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
`keycloak`. FreeMarker overrides cover the shared authentication layout, login
page, forgot-password page, login footer, and HTML email layout. Forms use
Keycloak's native field and button macros. Password recovery follows Sign in;
the recovery page puts instructions first and a back link after Submit.
The desktop brand pane uses the cropped company mark bundled at
`login/resources/img/company-logo.png`; the original supplied asset is retained
at `theme/logos/example_company.png`. English, German, and Dutch branding bundles
supplement upstream messages. The theme intentionally uses light mode, even if
the OS prefers dark mode.

On small screens, the white company-logo pane is hidden. The company name
appears above the Neurwerk wordmark instead; set `companyName` in
`theme/neurwerk/login/theme.properties` to customize it.

Reset-password, email verification, OTP, recovery codes, required actions, and
info/error pages share the wordmark, dark-indigo primary buttons, white fields,
and bottom-right credit. Functional page titles remain visible. OTP setup and
recovery-code pages have wider content areas and scroll naturally on short screens.

HTML emails use a blue text-co-branded header, white body, dark-indigo links, and
a right-aligned credit. Set `companyName` in `theme/neurwerk/email/theme.properties`
to the same company name as the login theme. No remote images are required;
Keycloak supplies action links, expiry text, translations, and plain-text emails.

## Local Preview

Requires Docker with Compose v2. The preview is disposable and binds host ports
only to loopback.

```bash
docker compose up --build --wait --wait-timeout 300
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

### Preview Individual Screens

Use the login preview link above in a private window (or sign out between users).
All accounts below initially use `Preview-only-123!`:

| Username | Screen shown after signing in |
| --- | --- |
| `theme-password` | Set a new password |
| `theme-otp` | Set up an authenticator, including QR and manual setup |
| `theme-profile` | Update profile |
| `theme-verify` | Verify email; the message appears in Mailpit |
| `theme-recovery` | Generate and save recovery codes |

To view OTP login, complete enrollment for `theme-otp` using your authenticator,
then sign in again in a fresh private session. Completing a required action
removes that prompt for the account. Recreating the disposable Keycloak container
resets these accounts from `preview/realm.json`.

For **forgot password**, click “Forgot password?” on the login page and enter
`theme-user`. Open the message in [Mailpit](http://localhost:8025) and follow its
link to see the **new-password** page. `theme-password` is a shortcut to the
new-password form without sending an email.

```bash
docker compose down
```

No persistent volumes are created. Removing the preview containers removes its
users, messages, and enrollment state. Rebuild/recreate after changing the theme;
the preview exercises the same baked-in assets as the image, not a live mount.
Never use this Compose setup or its `start-dev` command in production.

## Packaging And Releases

Current theme version: `0.1.0` in `VERSION`. Target Keycloak: `26.7.2`.

The Dockerfile extends `quay.io/keycloak/keycloak:26.7.2`, pinned by digest, and adds files under
`/opt/keycloak/themes/neurwerk/`. It preserves upstream startup behavior, caching,
user, entrypoint, and database handling. It does not run an optimized build or add
providers. Review and update the theme alongside every Keycloak version change.

Pull requests and main pushes build the theme image. The initial
repository bootstrap is authorized to push directly to `main` without a PR;
validation still applies. This exception does not change other repositories'
review or release rules.

Image publication is a separate, explicitly authorized action: pushing `vX.Y.Z`
must match `VERSION` exactly and pass the image-build workflow. The release workflow
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
