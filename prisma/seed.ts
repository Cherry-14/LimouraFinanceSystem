import { PrismaClient, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: build a date offset from today by `monthsAgo` months and `dayOfMonth`
function dateFor(monthsAgo: number, dayOfMonth: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(dayOfMonth);
  return d;
}

const SERVICES = [
  "Amazon Listing Images",
  "A+ Content",
  "Storefront Design",
  "Product Infographics",
  "Video Editing",
  "Branding Assets",
];

const EXPENSE_CATS = [
  { category: "Salaries", subs: ["Designer", "Editor", "PM"] },
  { category: "Freelancer Payments", subs: ["Illustrator", "3D Artist"] },
  { category: "Software Subscriptions", subs: ["Adobe Creative Cloud", "Figma", "Notion"] },
  { category: "AI Tools", subs: ["Midjourney", "ChatGPT Plus", "Runway"] },
  { category: "Internet & Utilities", subs: ["Fiber Internet", "Electricity"] },
  { category: "Rent", subs: ["Studio Rent"] },
  { category: "Marketing", subs: ["Meta Ads", "LinkedIn Ads"] },
  { category: "Equipment", subs: ["Monitor", "Tablet"] },
  { category: "Office Expenses", subs: ["Supplies", "Coffee"] },
];

async function main() {
  // wipe (only what we own)
  await prisma.auditLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.client.deleteMany();

  // ───── Clients
  const clients = await Promise.all(
    [
      { name: "Marcus Chen", company: "Verdant Wellness Co.", email: "marcus@verdantwellness.com", country: "USA" },
      { name: "Sophia Reyes", company: "Pacific Pantry", email: "sophia@pacificpantry.com", country: "USA" },
      { name: "Daniel Okafor", company: "Sundara Skincare", email: "daniel@sundara.co", country: "UK" },
      { name: "Aiko Tanaka", company: "Tanaka Home Goods", email: "aiko@tanakahome.jp", country: "Japan" },
      { name: "Liam O'Brien", company: "Hearthside Outdoor", email: "liam@hearthside.com", country: "Canada" },
      { name: "Priya Sharma", company: "Lumen Pet", email: "priya@lumenpet.com", country: "USA" },
    ].map((c) => prisma.client.create({ data: c })),
  );

  // ───── Sales (last 8 months)
  const salesData: Array<{
    invoiceNumber: string;
    projectName: string;
    serviceType: string;
    clientId: string;
    revenueCents: number;
    projectCostCents: number;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    amountPaidCents: number;
    invoiceDate: Date;
    paidDate: Date | null;
    notes: string;
  }> = [];

  let invCounter = 1;
  const inv = () => `LIM-${new Date().getFullYear()}-${String(invCounter++).padStart(4, "0")}`;

  // Generate ~3-6 sales per month over 8 months
  for (let m = 7; m >= 0; m--) {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      // Revenue ranges roughly by service
      const baseRev =
        service === "Video Editing"
          ? 180000 + Math.floor(Math.random() * 120000) // $1,800 – $3,000
          : service === "A+ Content"
            ? 90000 + Math.floor(Math.random() * 80000)
            : service === "Storefront Design"
              ? 150000 + Math.floor(Math.random() * 100000)
              : service === "Branding Assets"
                ? 200000 + Math.floor(Math.random() * 200000)
                : service === "Product Infographics"
                  ? 50000 + Math.floor(Math.random() * 40000)
                  : 75000 + Math.floor(Math.random() * 60000);

      const cost = Math.floor(baseRev * (0.18 + Math.random() * 0.22));
      const day = 1 + Math.floor(Math.random() * 27);
      const invoiceDate = dateFor(m, day);
      // Older invoices mostly paid; recent ones mixed
      const r = Math.random();
      let status: PaymentStatus;
      let paid = 0;
      let paidDate: Date | null = null;
      if (m >= 2) {
        status = "PAID";
        paid = baseRev;
        paidDate = dateFor(m, Math.min(28, day + 7));
      } else if (r < 0.55) {
        status = "PAID";
        paid = baseRev;
        paidDate = dateFor(m, Math.min(28, day + 5));
      } else if (r < 0.75) {
        status = "PARTIAL";
        paid = Math.floor(baseRev * 0.5);
      } else if (r < 0.92) {
        status = "PENDING";
      } else {
        status = "OVERDUE";
      }

      salesData.push({
        invoiceNumber: inv(),
        projectName: `${service} — ${client.company?.split(" ")[0] ?? "Project"}`,
        serviceType: service,
        clientId: client.id,
        revenueCents: baseRev,
        projectCostCents: cost,
        paymentStatus: status,
        paymentMethod: ["Bank Transfer", "PayPal", "Wise"][Math.floor(Math.random() * 3)],
        amountPaidCents: paid,
        invoiceDate,
        paidDate,
        notes: "",
      });
    }
  }

  await prisma.sale.createMany({ data: salesData });

  // ───── Expenses (last 8 months)
  const expenseData: Array<{
    category: string;
    subcategory: string;
    vendor: string;
    description: string;
    amountCents: number;
    expenseDate: Date;
  }> = [];

  for (let m = 7; m >= 0; m--) {
    // Monthly recurring
    expenseData.push({
      category: "Rent",
      subcategory: "Studio Rent",
      vendor: "Suncoast Realty",
      description: "Monthly studio rent",
      amountCents: 80000 + Math.floor(Math.random() * 5000),
      expenseDate: dateFor(m, 1),
    });
    expenseData.push({
      category: "Salaries",
      subcategory: "Designer",
      vendor: "Payroll",
      description: "Lead designer salary",
      amountCents: 280000,
      expenseDate: dateFor(m, 28),
    });
    expenseData.push({
      category: "Salaries",
      subcategory: "Editor",
      vendor: "Payroll",
      description: "Video editor salary",
      amountCents: 220000,
      expenseDate: dateFor(m, 28),
    });
    expenseData.push({
      category: "Software Subscriptions",
      subcategory: "Adobe Creative Cloud",
      vendor: "Adobe",
      description: "Creative Cloud — 3 seats",
      amountCents: 18000 + (m < 3 ? 2500 : 0), // bump in recent months
      expenseDate: dateFor(m, 5),
    });
    expenseData.push({
      category: "Software Subscriptions",
      subcategory: "Figma",
      vendor: "Figma",
      description: "Figma Professional",
      amountCents: 4500,
      expenseDate: dateFor(m, 5),
    });
    expenseData.push({
      category: "AI Tools",
      subcategory: "Midjourney",
      vendor: "Midjourney",
      description: "Pro plan",
      amountCents: 3000,
      expenseDate: dateFor(m, 10),
    });
    expenseData.push({
      category: "Internet & Utilities",
      subcategory: "Fiber Internet",
      vendor: "Globe Telecom",
      description: "Studio fiber",
      amountCents: 7500,
      expenseDate: dateFor(m, 8),
    });

    // Random extras
    const extras = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extras; i++) {
      const cat = EXPENSE_CATS[Math.floor(Math.random() * EXPENSE_CATS.length)];
      const sub = cat.subs[Math.floor(Math.random() * cat.subs.length)];
      expenseData.push({
        category: cat.category,
        subcategory: sub,
        vendor: sub,
        description: `${sub} — ${cat.category}`,
        amountCents: 2000 + Math.floor(Math.random() * 30000),
        expenseDate: dateFor(m, 1 + Math.floor(Math.random() * 27)),
      });
    }
  }

  await prisma.expense.createMany({ data: expenseData });

  console.log(`Seeded ${clients.length} clients, ${salesData.length} sales, ${expenseData.length} expenses.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
