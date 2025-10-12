/**
 * Reset Password with Token
 * POST /api/auth/reset-password
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();

    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, token, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find reset token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset token' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordReset.delete({
        where: { email: email.toLowerCase() }
      });
      return NextResponse.json(
        { success: false, error: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (resetRecord.used) {
      return NextResponse.json(
        { success: false, error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // Verify token
    if (resetRecord.token !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { email: email.toLowerCase() },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}