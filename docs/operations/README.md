# Operations

## Installation and selection

The published image is `ghcr.io/neurwerk/k8s-stack-keycloak-theme`. It already contains the theme at `/opt/keycloak/themes/neurwerk/`. Running that image makes the theme available; realm settings select it separately for login and email. The local preview selects both through `loginTheme` and `emailTheme` in its [realm fixture](../../preview/realm.json).

For Base deployments, use the selected release's [Keycloak server values](https://github.com/neurwerk/k8s_stack_base/blob/main/charts/keycloak/server/values.yaml) as the authoritative configuration. Base owns the workload, image pin, realm initialization, SMTP, and client branding mounts.

| Base value | Effect |
| --- | --- |
| `authKeycloak.keycloakImage` | Selects the reviewed theme image by full version and digest. |
| `authKeycloak.loginTheme` | Selects `neurwerk` for login, or `client-brand` with branding enabled. |
| `authKeycloak.emailTheme` | Independently selects `neurwerk` or the enabled `client-brand` email theme. |
| `authKeycloak.branding.enabled` | Mounts the fixed `client-brand` child theme; does not select it. |
| `authKeycloak.realmDisplayName` | Supplies `companyName` to the child login and email themes. |
| `authKeycloak.branding.logoConfigMapName` | Names the client-provided logo ConfigMap in the Keycloak namespace. |
| `authKeycloak.branding.logoFormat` | Selects `png` or `svg`; the ConfigMap must supply `company-logo.png` or `company-logo.svg` accordingly. |

The Base [branding template](https://github.com/neurwerk/k8s_stack_base/blob/main/charts/keycloak/server/templates/branding-config-map.yaml) sets `parent=neurwerk` for both child themes. Company name and logo are the supported client customization inputs; templates and layout remain owned here. Selecting `client-brand` requires branding to be enabled. Empty theme selections are omitted by Base rather than clearing an existing realm selection.

Keycloak owns registration policy, enabled locales, authentication flows, and SMTP delivery. Theme selection does not configure those settings. See the upstream [theme guide](https://www.keycloak.org/ui-customization/themes) for Keycloak's inheritance and realm-selection model.

## Verification

After an approved deployment, confirm that the realm's login and email selections match the intended theme. Open the application's sign-in flow and check the company logo on desktop, company name on a narrow screen, and password-recovery link when enabled. Exercise an affected required-action page because it inherits the shared layout. For email changes, trigger an approved recovery or verification flow and confirm both HTML branding and readable plain-text content. The [local preview](../development/README.md#disposable-preview) supports these checks with synthetic data.

## Release ownership

[`VERSION`](../../VERSION) declares the theme release. The [release workflow](../../.github/workflows/release.yaml) requires an exact `vX.Y.Z` tag matching that file, runs the validation workflow, and publishes a `linux/amd64` image with source, revision, and version labels. It refuses to overwrite an existing image version.

Publishing an image does not update Base or select a theme in any realm. Image publication, Base image-pin changes, and client adoption are separate actions. Workspace operators follow the shared [image-release](https://github.com/neurwerk/docs/blob/main/dev/operations/image-releases.md) and [upgrade](https://github.com/neurwerk/docs/blob/main/dev/operations/upgrades.md) guides for those actions.
