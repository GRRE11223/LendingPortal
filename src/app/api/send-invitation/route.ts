import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    console.log('Starting invitation process...');
    const { email, name, role } = await request.json();
    console.log('Received data:', { email, name, role });

    if (!email || !name) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check environment variables
    console.log('Checking environment variables...');
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Missing Gmail configuration');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate a simple token
    const token = Math.random().toString(36).substring(2);
    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/setup-account?token=${token}`;
    console.log('Generated setup URL:', setupUrl);

    // Send the invitation email
    console.log('Attempting to send email...');
    await transporter.sendMail({
      from: `"Bluebono Portal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Bluebono Portal - Complete Your Account Setup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Bluebono Portal!</h2>
          <p>Hello ${name},</p>
          <p>You've been invited to join the Bluebono Portal as a ${role}. To complete your account setup, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Account Setup
            </a>
          </div>
          <p>This invitation link will expire in 24 hours.</p>
          <p>If you did not request this invitation, please ignore this email.</p>
          <p>Best regards,<br>The Bluebono Team</p>
        </div>
      `
    });
    console.log('Email sent successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invitation:', error);
    // 如果是 nodemailer 错误，输出更多详细信息
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send invitation' },
      { status: 500 }
    );
  }
} 