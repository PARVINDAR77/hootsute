import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@omnisocial.ai' },
    include: {
      workspaceMemberships: {
        include: {
          workspace: true,
        },
      },
    },
  });

  console.log('Admin user found:', user?.email, 'Role:', user?.role);
  console.log('Workspaces:', user?.workspaceMemberships.map(m => ({
    id: m.workspaceId,
    name: m.workspace.name,
    role: m.role,
    status: m.status
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
