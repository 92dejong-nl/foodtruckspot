import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, companyName } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, wachtwoord en naam zijn verplicht" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is al in gebruik" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Calculate trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName,
        subscriptionStatus: "trial",
        trialEndsAt,
      }
    })

    return NextResponse.json(
      {
        message: "Account succesvol aangemaakt",
        user: { id: user.id, email: user.email, name: user.name }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Er is iets misgegaan bij het aanmaken van je account" },
      { status: 500 }
    )
  }
}