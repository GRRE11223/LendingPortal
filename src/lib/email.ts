import nodemailer from 'nodemailer';

interface InvitationEmailParams {
  to: string;
  firstName: string;
  inviteLink: string;
  brokerName: string;
}

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvitationEmail({
  to,
  firstName,
  inviteLink,
  brokerName,
}: InvitationEmailParams) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to ${brokerName}'s Lending Portal</h2>
      <p>Hello ${firstName},</p>
      <p>You have been invited to join ${brokerName}'s lending portal. To complete your registration, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background-color: #007bff; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 4px;
                  display: inline-block;">
          Complete Registration
        </a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${inviteLink}</p>
      <p>This invitation link will expire in 24 hours.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 12px;">
        If you didn't expect this invitation, please ignore this email.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `Welcome to ${brokerName}'s Lending Portal - Complete Your Registration`,
      html: emailContent,
    });
    console.log('Invitation email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
} 