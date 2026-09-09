# Third-Party And Brand Assets

Original theme code is covered by `LICENSE`. This does not grant rights to
Neurwerk's name, logo, or other trademarks.

## Neurwerk Website Assets

The website assets below were retrieved from the public website on 2026-09-09,
without modification. Paths below are relative to `https://www.neurwerk.com/`;
bundled files are under `theme/neurwerk/login/resources/`.

| Source | Bundled file | SHA-256 |
| --- | --- | --- |
| `assets/images/logo_black.png` | `img/logo_black.png` | `ee763463266782b3e678e07b2f80228db974c393494071f0de227dd0ce7c7fc8` |
| Supplied `theme/logos/example_company.png`, trimmed to visible bounds | `img/company-logo.png` | `a1c7107ac0cb870d517ce1af27c6e9623d312340842dcffbee5ada88a10660df` |
| `assets/favicon/favicon.ico` | `img/favicon.ico` | `438891a59b533183387015927becb02919bceed0bf31008b947dd684f5c1a37a` |
| `assets/fonts/Inter-Regular.ttf` | `fonts/Inter-Regular.ttf` | `1b08e7fc267a5c7e1d614100f604b83e7e8a0be241f0f288faa2b3ac93a683ba` |
| `assets/fonts/Inter-SemiBold.ttf` | `fonts/Inter-SemiBold.ttf` | `e7a1aaf7eda9f2fad4131725fa556265ec75ca7b2d756260173a040363e8d4f7` |

The logo and favicon remain Neurwerk brand assets. The Inter fonts are copyright
The Inter Project Authors and distributed under SIL Open Font License 1.1. The
full licence ships alongside the fonts in `fonts/OFL.txt`, sourced from
<https://github.com/rsms/inter/blob/v4.1/LICENSE.txt>.

Palette and typography references:

- <https://www.neurwerk.com/css/config/_colors.css>
- <https://www.neurwerk.com/css/config/_fonts.css>

Login assets are bundled, not fetched from the website at runtime. Emails use
a text wordmark and system fonts, with no external images or tracking pixels.

## Keycloak

The image retains upstream Keycloak's Apache 2.0 licence and notices. Native
field macros, scripts, translations, and action emails are inherited from the
installed Keycloak distribution. `login/login.ftl` is adapted from Keycloak
26.7.2's Apache-2.0-licensed `keycloak.v2/login/login.ftl` to place password
recovery after Sign in and omit registration.
`login/template.ftl` and `login/login-reset-password.ftl` are also adapted from
the corresponding Keycloak 26.7.2 `keycloak.v2/login/` templates for shared
branding and recovery-page layout. The shared template retains upstream session
checking, resource loading, and authentication flow hooks; review these overrides
when upgrading Keycloak.

- <https://github.com/keycloak/keycloak/blob/26.7.2/LICENSE.txt>
- <https://www.keycloak.org/ui-customization/themes>

The email wrapper uses Keycloak's documented layout macro interface. The theme
does not imply endorsement by Keycloak. Visible footer attribution is voluntary.

## Design Reference

<https://github.com/dkforge31/dkforge-keycloak-business-theme-free> was consulted
as visual inspiration. No DKForge source, templates, scripts, or assets are
included, and the theme has no dependency on that project.
