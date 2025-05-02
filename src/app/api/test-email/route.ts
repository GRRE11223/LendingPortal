import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 测试邮件内容
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // 发送到同一个邮箱
      subject: 'Test Email from Lending Portal',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify SMTP configuration.</p>
        <p>If you receive this email, your SMTP settings are working correctly!</p>
      `,
    };

    // 发送邮件
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Failed to send test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    );
  }
} 