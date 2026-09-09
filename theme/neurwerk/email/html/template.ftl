<#macro emailLayout>
<!DOCTYPE html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <style>
    a { color: #5563ab; text-decoration: underline; }
    p { margin: 0 0 20px; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;color:#212121;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 24px;font-size:28px;font-weight:700;letter-spacing:-1px;color:#212121;">neurwerk</td>
          </tr>
          <tr>
            <td style="padding:32px 24px;background-color:#ffffff;border:1px solid #c7c5d4;border-radius:12px;font-size:16px;line-height:1.65;overflow-wrap:anywhere;">
              <#nested>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0 0;font-size:12px;line-height:1.5;color:#5f5f6b;">
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
