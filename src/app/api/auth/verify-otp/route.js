/**
 * Verify OTP for Password Reset
 * POST /api/auth/verify-otp
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find OTP record
    const otpRecord = await prisma.otp.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'OTP not found. Please request a new OTP.' },
        { status: 404 }
      );
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otp.delete({
        where: { email: email.toLowerCase() }
      });
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 3) {
      await prisma.otp.delete({
        where: { email: email.toLowerCase() }
      });
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.code !== otp) {
      // Increment attempts
      await prisma.otp.update({
        where: { email: email.toLowerCase() },
        data: { attempts: otpRecord.attempts + 1 }
      });

      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP is valid - generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
    
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store reset token
    await prisma.passwordReset.upsert({
      where: { email: email.toLowerCase() },
      update: {
        token: resetToken,
        expiresAt: tokenExpires,
        used: false
      },
      create: {
        email: email.toLowerCase(),
        token: resetToken,
        expiresAt: tokenExpires,
        used: false
      }
    });

    // Delete OTP record
    await prisma.otp.delete({
      where: { email: email.toLowerCase() }
    });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}