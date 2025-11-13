export function getPasswordResetEmailTemplate(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Reset Your Password
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                Hi there,
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 20px;">
                Or copy and paste this link in your browser:
              </p>
              <p style="margin: 10px 0 0; color: #f5576c; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>
              <p style="margin: 30px 0 10px; color: #e74c3c; font-size: 14px; line-height: 20px; font-weight: 600;">
                ⚠️ Security Notice:
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px; line-height: 18px;">
                • This link will expire in 1 hour for security reasons
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 13px; line-height: 18px;">
                • If you didn't request a password reset, please ignore this email
              </p>
              <p style="margin: 0; color: #999999; font-size: 13px; line-height: 18px;">
                • Your password won't change until you create a new one via the link above
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Your App Name. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
