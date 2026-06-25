import bcrypt from "bcryptjs";
import { PrismaClient, Role, PricingType, SessionStatus, PurchaseType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MathHub database...");

  // ── Users ──
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@mathhub.app" },
    update: {},
    create: {
      name: "Mohamed (Teacher)",
      email: "admin@mathhub.app",
      passwordHash: await bcrypt.hash("Admin1234!", 12),
      role: Role.SUPERADMIN,
      studentCode: null,
    },
  });

  const assistant = await prisma.user.upsert({
    where: { email: "assistant@mathhub.app" },
    update: {},
    create: {
      name: "Sara (Assistant)",
      email: "assistant@mathhub.app",
      passwordHash: await bcrypt.hash("Assist1234!", 12),
      role: Role.ASSISTANT,
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: "ahmed@student.mathhub.app" },
    update: {},
    create: {
      name: "Ahmed Khaled",
      email: "ahmed@student.mathhub.app",
      passwordHash: await bcrypt.hash("Student1234!", 12),
      role: Role.STUDENT,
      studentCode: "STU-2024001",
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "lina@student.mathhub.app" },
    update: {},
    create: {
      name: "Lina Hassan",
      email: "lina@student.mathhub.app",
      passwordHash: await bcrypt.hash("Student1234!", 12),
      role: Role.STUDENT,
      studentCode: "STU-2024002",
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@mathhub.app" },
    update: {},
    create: {
      name: "Khaled Mansour (Parent)",
      email: "parent@mathhub.app",
      passwordHash: await bcrypt.hash("Parent1234!", 12),
      role: Role.PARENT,
    },
  });

  // ── Parent-Student link ──
  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student1.id } },
    update: {},
    create: { parentId: parent.id, studentId: student1.id },
  });

  // ── Course ──
  const course = await prisma.course.upsert({
    where: { id: "seed-course-001" },
    update: {},
    create: {
      id: "seed-course-001",
      name: "Calculus I — Full Course",
      description: "Comprehensive Calculus I course covering limits, derivatives, and integrals.",
      coursePrice: 300,
      sessionPrice: 50,
    },
  });

  // ── Sessions ──
  const now = new Date();

  const session1 = await prisma.session.upsert({
    where: { id: "seed-session-001" },
    update: {},
    create: {
      id: "seed-session-001",
      title: "Introduction to Limits",
      topic: "Limits",
      description: "Understanding what limits are and how to compute them.",
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.UPCOMING,
      pricingType: PricingType.COURSE,
      courseId: course.id,
    },
  });

  const session2 = await prisma.session.upsert({
    where: { id: "seed-session-002" },
    update: {},
    create: {
      id: "seed-session-002",
      title: "Derivatives — Rules & Applications",
      topic: "Derivatives",
      description: "Power rule, chain rule, product rule, and real-world applications.",
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.UPCOMING,
      pricingType: PricingType.COURSE,
      courseId: course.id,
    },
  });

  const session3 = await prisma.session.upsert({
    where: { id: "seed-session-003" },
    update: {},
    create: {
      id: "seed-session-003",
      title: "Integration Basics",
      topic: "Integration",
      scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.RECORDING,
      pricingType: PricingType.SESSION,
      sessionPrice: 50,
    },
  });

  // ── Enrollments ──
  await prisma.enrollment.upsert({
    where: { userId_sessionId: { userId: student1.id, sessionId: session1.id } },
    update: {},
    create: { userId: student1.id, sessionId: session1.id, purchaseType: PurchaseType.FREE },
  });

  await prisma.enrollment.upsert({
    where: { userId_sessionId: { userId: student2.id, sessionId: session1.id } },
    update: {},
    create: { userId: student2.id, sessionId: session1.id, purchaseType: PurchaseType.FREE },
  });

  // ── Assignment ──
  await prisma.assignment.upsert({
    where: { id: "seed-assignment-001" },
    update: {},
    create: {
      id: "seed-assignment-001",
      title: "Problem Set 1: Limits",
      description: "Solve the 10 limit problems from the textbook, pages 45-48.",
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      sessionId: session1.id,
    },
  });

  // ── Quiz ──
  const quiz = await prisma.quiz.upsert({
    where: { id: "seed-quiz-001" },
    update: {},
    create: {
      id: "seed-quiz-001",
      title: "Limits Quiz — Week 1",
      description: "A quick 3-question quiz on the basics of limits.",
      sessionId: session1.id,
      isPublished: true,
    },
  });

  const q1 = await prisma.question.upsert({
    where: { id: "seed-q-001" },
    update: {},
    create: {
      id: "seed-q-001",
      quizId: quiz.id,
      text: "What is lim(x→2) of (x² - 4) / (x - 2)?",
      type: "MULTIPLE_CHOICE",
      order: 1,
      points: 2,
    },
  });

  await prisma.choice.upsert({
    where: { id: "seed-c-001" },
    update: {},
    create: { id: "seed-c-001", questionId: q1.id, text: "0", isCorrect: false, order: 1 },
  });
  await prisma.choice.upsert({
    where: { id: "seed-c-002" },
    update: {},
    create: { id: "seed-c-002", questionId: q1.id, text: "2", isCorrect: false, order: 2 },
  });
  await prisma.choice.upsert({
    where: { id: "seed-c-003" },
    update: {},
    create: { id: "seed-c-003", questionId: q1.id, text: "4", isCorrect: true, order: 3 },
  });
  await prisma.choice.upsert({
    where: { id: "seed-c-004" },
    update: {},
    create: { id: "seed-c-004", questionId: q1.id, text: "Undefined", isCorrect: false, order: 4 },
  });

  await prisma.question.upsert({
    where: { id: "seed-q-002" },
    update: {},
    create: {
      id: "seed-q-002",
      quizId: quiz.id,
      text: "In your own words, explain what a limit represents.",
      type: "TEXT_ANSWER",
      order: 2,
      points: 3,
    },
  });

  console.log("✅ Seed complete!");
  console.log("───────────────────────────────────────");
  console.log("Accounts:");
  console.log(`  SUPERADMIN : admin@mathhub.app       / Admin1234!`);
  console.log(`  ASSISTANT  : assistant@mathhub.app   / Assist1234!`);
  console.log(`  STUDENT 1  : ahmed@student.mathhub.app / Student1234!`);
  console.log(`  STUDENT 2  : lina@student.mathhub.app  / Student1234!`);
  console.log(`  PARENT     : parent@mathhub.app      / Parent1234!`);
  console.log("───────────────────────────────────────");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
