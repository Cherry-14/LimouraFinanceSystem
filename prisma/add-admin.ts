import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("081022_Cherry", 10);
  const user = await prisma.user.upsert({
    where: { username: "cherry" },
    update: { passwordHash, role: "admin" },
    create: { username: "cherry", passwordHash, role: "admin" },
  });
  console.log(`Admin user ready: ${user.username} (role: ${user.role})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
