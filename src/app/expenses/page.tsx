import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExpensesView } from "@/components/expenses/ExpensesView";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    where: { deletedAt: null },
    orderBy: { expenseDate: "desc" },
    take: 500,
  });

  const serialized = expenses.map((e) => ({
    ...e,
    expenseDate: e.expenseDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt?.toISOString() ?? null,
  }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operational"
        title="Expenses"
        description="Track every operational cost — salaries, software, ads, rent."
      />
      <ExpensesView initialExpenses={serialized as any} />
    </AppShell>
  );
}
