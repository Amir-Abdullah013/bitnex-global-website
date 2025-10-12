/**
 * Send OTP for Password Reset
 * POST /api/auth/send-otp
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  let prisma;
  let transporter;
  
  try {
    // Dynamic imports to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    const nodemailer = await import('nodemailer');
    
    prisma = new PrismaClient();

    // Email configuration
    transporter = nodemailer.default.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.otp.upsert({
      where: { email: email.toLowerCase() },
      update: {
        code: otp,
        expiresAt,
        attempts: 0
      },
      create: {
        email: email.toLowerCase(),
        code: otp,
        expiresAt,
        attempts: 0
      }
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Bitnex Global - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #F0B90B, #FFD700); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Bitnex Global</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>You have requested to reset your password. Use the following OTP to proceed:</p>
            <div style="background: #fff; border: 2px solid #F0B90B; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #F0B90B; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from Bitnex Global. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}