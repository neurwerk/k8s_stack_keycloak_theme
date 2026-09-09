<#macro emailLayout>
<!DOCTYPE html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <style>
    a { color: #2a3c96; text-decoration: underline; }
    p { margin: 0 0 20px; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;color:#212121;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td bgcolor="#5563ab" style="padding:28px 24px;background-color:#5563ab;border-radius:12px 12px 0 0;color:#ffffff;font-size:16px;line-height:1.6;">
              <span style="color:#ffffff;">${properties.companyName!'Example Company'}</span>
              <span style="color:#ffffff;padding:0 8px;">/</span>
              <span style="font-size:26px;font-weight:700;letter-spacing:-1px;color:#ffffff;">neurwerk</span>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="padding:32px 24px;background-color:#ffffff;color:#212121;border:1px solid #c7c5d4;border-top:0;border-radius:0 0 12px 12px;font-size:16px;line-height:1.65;overflow-wrap:anywhere;">
              <#nested>
            </td>
          </tr>
          <tr>
            <td align="right" style="padding:16px 4px 0;font-size:12px;line-height:1.5;color:#5f5f6b;">
              <a href="https://www.keycloak.org/" style="color:#5f5f6b;text-decoration:none;">${msg("nwPoweredBy")}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
</#macro>
