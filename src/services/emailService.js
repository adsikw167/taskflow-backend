const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  return {
    sendMail: async (mailOptions) => {
      console.log('\n📧 Email would be sent:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Link:', mailOptions.html.match(/href="([^"]+)"/)?.[1]);
      return { messageId: 'dev-mode' };
    }
  };
};

const sendInvitationEmail = async ({ to, projectName, inviterName, inviteLink }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || 'TaskFlow <noreply@taskflow.com>',
    to,
    subject: `You've been invited to join ${projectName} on TaskFlow`,
    text: `Hi! ${inviterName} invited you to "${projectName}". Accept: ${inviteLink}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #7c6aff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1>🎉 You're Invited!</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
      <p>Hi there!</p>
      <p><strong>${inviterName}</strong> invited you to <strong>"${projectName}"</strong> on TaskFlow.</p>
      <a href="${inviteLink}" style="display: inline-block; background: #7c6aff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
      <p style="color: #666; font-size: 14px;">Or copy: ${inviteLink}</p>
      <p style="margin-top: 30px; color: #666;">Expires in 7 days.</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendInvitationEmail };
