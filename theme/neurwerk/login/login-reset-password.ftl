<#-- Adapted from Keycloak 26.7.2 keycloak.v2/login/login-reset-password.ftl (Apache-2.0). -->
<#import "template.ftl" as layout>
<#import "field.ftl" as field>
<#import "buttons.ftl" as buttons>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username'); section>
  <#if section = "header">
    ${msg("emailForgotTitle")}
  <#elseif section = "form">
    <p class="nw-instruction" id="nw-reset-instruction">
      <#if realm.duplicateEmailsAllowed>${msg("emailInstructionUsername")}<#else>${msg("emailInstruction")}</#if>
    </p>
    <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post" aria-describedby="nw-reset-instruction">
      <#assign label>
        <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
      </#assign>
      <@field.input name="username" label=label value=auth.attemptedUsername!'' autofocus=true />
      <@buttons.actionGroup>
        <@buttons.button id="kc-form-buttons" label="doSubmit"/>
      </@buttons.actionGroup>
      <div class="nw-forgot-password"><a href="${url.loginUrl}">${msg("backToLogin")}</a></div>
    </form>
  </#if>
</@layout.registrationLayout>
