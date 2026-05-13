import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExpensesView } from "@/components/expenses/ExpensesView";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const { data: expenses } = await db
    .from("Expense")
    .select("*")
    .is("deletedAt", null)
    .order("expenseDate", { ascending: false })
    .limit(500);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operational"
        title="Expenses"
        description="Track every operational cost — salaries, software, ads, rent."
      />
      <ExpensesView initialExpenses={(expenses ?? []) as any} />
    </AppShell>
  );
}
