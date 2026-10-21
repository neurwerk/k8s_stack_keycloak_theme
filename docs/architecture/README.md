# Architecture

## Theme composition

Keycloak reads the native FreeMarker templates and static resources under [`theme/neurwerk/`](../../theme/neurwerk/). The repository supplies login and email themes, not account-console or administration-console themes.

| Source | Responsibility |
| --- | --- |
| [`login/theme.properties`](../../theme/neurwerk/login/theme.properties) | Inherits `keycloak.v2`, imports `common/keycloak`, and loads upstream CSS before `css/neurwerk.css`. Disables dark mode. |
| [`login/template.ftl`](../../theme/neurwerk/login/template.ftl) | Shared page layout, branding, resource loading, session checks, and authentication-flow hooks. |
| [`login/login.ftl`](../../theme/neurwerk/login/login.ftl) | Sign-in form using inherited field, button, social-provider, and passkey macros; places password recovery after sign-in. |
| [`login/login-reset-password.ftl`](../../theme/neurwerk/login/login-reset-password.ftl) | Recovery instructions and username/email form. |
| [`login/footer.ftl`](../../theme/neurwerk/login/footer.ftl) | Translated Keycloak attribution. |
| [`login/resources/`](../../theme/neurwerk/login/resources/) | Custom CSS, bundled Inter fonts, company logo, Neurwerk wordmark, and favicon. |
| [`email/theme.properties`](../../theme/neurwerk/email/theme.properties) and [`email/html/template.ftl`](../../theme/neurwerk/email/html/template.ftl) | Inherit `keycloak` email content and wrap HTML messages with company branding and a text wordmark. |

Other login pages, action-email bodies, plain-text emails, macros, and JavaScript come from the installed Keycloak distribution. Changes to the shared login layout or CSS therefore affect inherited required-action pages too. The [Dockerfile](../../Dockerfile) pins that distribution; template compatibility must be reviewed when it changes.

## Presentation boundaries

The login CSS provides a two-column desktop layout and hides the company-logo pane on narrow screens, where `companyName` appears above the wordmark. `companyLogoFormat=png` uses `img/company-logo.png`; `svg` selects `img/company-logo.svg`. The image supplies the PNG default; Base can provide a child-theme logo and company name without replacing the shared layout.

The sign-in page omits registration links and the shared layout omits the locale picker. These presentation choices do not disable realm registration or internationalization. Password recovery, remember-me, identity providers, and required actions still depend on Keycloak realm configuration.

The login and email `messages/` directories override attribution text in English, German, and Dutch; login bundles also override `loginTitleHtml`. Other translations are inherited. The preview realm enables these three locales. HTML email uses system fonts and no external images; login assets are served from the theme. Asset provenance and licensing are recorded in [THIRD_PARTY.md](../../THIRD_PARTY.md).

## Packaging

The Dockerfile copies `theme/neurwerk/` to `/opt/keycloak/themes/neurwerk/` and legal notices to `/opt/keycloak/legal/neurwerk/`. There is no compilation or JAR packaging step. [`.dockerignore`](../../.dockerignore) excludes preview data and `theme/logos/`; the latter holds source artwork, not runtime assets. The output is a complete Keycloak image, not an asset-only installer.
