FROM quay.io/keycloak/keycloak:26.7.2@sha256:9d1f1b2b7261ff53c66cb1092dfcdc34a5fb77e81f9e6a6e75b8b6a795de8067

COPY --chown=keycloak:keycloak theme/neurwerk/ /opt/keycloak/themes/neurwerk/
COPY --chown=keycloak:keycloak LICENSE THIRD_PARTY.md /opt/keycloak/legal/neurwerk/

LABEL org.opencontainers.image.source="https://github.com/neurwerk/k8s_stack_keycloak_theme" \
      org.opencontainers.image.title="Keycloak with Neurwerk login and email theme"
