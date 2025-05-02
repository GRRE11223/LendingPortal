import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        role: true,
        broker: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 400 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        passwordHash,
        firstName: '',  // These will be updated later
        lastName: '',
        roleId: invitation.roleId,
        brokerId: invitation.brokerId,
        status: 'active',
        isAdmin: invitation.role.scope === 'admin',
      },
    });

    // Delete the used invitation
    await prisma.invitation.delete({
      where: { id: invitation.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    );
  }
} 