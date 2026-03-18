/**
 * Database seed script.
 * Creates default data: admin user, payment concepts, payment methods,
 * school cycle, and groups.
 * Safe to run multiple times — uses upsert to avoid duplicates.
 */

import { PrismaClient, GroupLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin User ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('ColegioAlas26', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'Administrador',
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.username}`);

  // ─── Payment Concepts ────────────────────────────────────
  const concepts = [
    { name: 'Inscripción', type: 'mandatory' as const, defaultAmount: 3000, isMonthly: false },
    { name: 'Colegiatura', type: 'mandatory' as const, defaultAmount: 2500, isMonthly: true },
    { name: 'Material',    type: 'mandatory' as const, defaultAmount: 1500, isMonthly: false },
    { name: 'Seguro',      type: 'mandatory' as const, defaultAmount: 800,  isMonthly: false },
  ];

  for (const concept of concepts) {
    await prisma.paymentConcept.upsert({
      where: { id: concepts.indexOf(concept) + 1 },
      update: {},
      create: {
        name: concept.name,
        type: concept.type,
        defaultAmount: concept.defaultAmount,
        isMonthly: concept.isMonthly,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Payment concepts: ${concepts.map(c => c.name).join(', ')}`);

  // ─── Payment Methods ──────────────────────────────────────
  const methods = ['Efectivo', 'Transferencia', 'Tarjeta'];

  for (const name of methods) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }
  console.log(`  ✓ Payment methods: ${methods.join(', ')}`);

  // ─── School Cycle ────────────────────────────────────────
  const cycle = await prisma.schoolCycle.upsert({
    where: { name: '2025-2026' },
    update: {},
    create: {
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-07-31'),
      isActive: true,
    },
  });
  console.log(`  ✓ School cycle: ${cycle.name} (active)`);

  // ─── Groups ──────────────────────────────────────────────
  // Kinder 1-3, Primaria 1-6, Secundaria 1-3, Prepa 1-3 (sections A, B)
  // promotionOrder uses gap formula: levelIndex * 1000 + grade * 10 + sectionIndex
  const LEVEL_ORDER: Record<GroupLevel, number> = {
    kinder: 1, primaria: 2, secundaria: 3, prepa: 4,
  };

  const groupDefinitions: { level: GroupLevel; grades: number[] }[] = [
    { level: 'kinder',     grades: [1, 2, 3] },
    { level: 'primaria',   grades: [1, 2, 3, 4, 5, 6] },
    { level: 'secundaria', grades: [1, 2, 3] },
    { level: 'prepa',      grades: [1, 2, 3] },
  ];

  const sections = ['A', 'B'];
  let groupCount = 0;

  for (const def of groupDefinitions) {
    for (const grade of def.grades) {
      for (const section of sections) {
        const name = `${grade}-${section}`;
        const sectionIndex = section.charCodeAt(0) - 65;
        const promotionOrder = LEVEL_ORDER[def.level] * 1000 + grade * 10 + sectionIndex;

        const existing = await prisma.group.findFirst({
          where: {
            level: def.level,
            grade: String(grade),
            section,
            schoolCycleId: cycle.id,
          },
        });

        if (!existing) {
          await prisma.group.create({
            data: {
              name,
              level: def.level,
              grade: String(grade),
              section,
              promotionOrder,
              schoolCycleId: cycle.id,
              isActive: true,
            },
          });
          groupCount++;
        }
      }
    }
  }
  console.log(`  ✓ Groups created: ${groupCount} (Kinder 1-3, Primaria 1-6, Secundaria 1-3, Prepa 1-3 — sections A, B)`);

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
