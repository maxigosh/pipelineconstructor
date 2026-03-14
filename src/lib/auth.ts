import { prisma } from "./prisma"

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@pipeline.dev",
  name: "Demo User",
  avatar_url: null,
  created_at: new Date(),
}

async function ensureDemoUser() {
  try {
    await prisma.user.upsert({
      where: { id: DEMO_USER_ID },
      update: {},
      create: {
        id: DEMO_USER_ID,
        email: "demo@pipeline.dev",
        name: "Demo User",
      },
    })
  } catch (e) {
    console.error("ensureDemoUser failed (will use hardcoded):", e)
  }
}

export async function getCurrentUser() {
  await ensureDemoUser()
  return DEMO_USER
}
