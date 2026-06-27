import bcrypt from "bcryptjs";
import { PrismaClient, Role, PricingType, SessionStatus, PurchaseType, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MathHub database...");

  // Clean existing tables to avoid duplicate key violations
  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.choice.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.parentStudent.deleteMany({});
  await prisma.user.deleteMany({});

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

  // ── Courses ──
  const course1 = await prisma.course.upsert({
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

  const course2 = await prisma.course.upsert({
    where: { id: "seed-course-002" },
    update: {},
    create: {
      id: "seed-course-002",
      name: "Linear Algebra — Foundations",
      description: "Master matrices, vector spaces, eigenvalues, and eigenvectors.",
      coursePrice: 250,
      sessionPrice: 40,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: "seed-course-003" },
    update: {},
    create: {
      id: "seed-course-003",
      name: "Differential Equations",
      description: "First-order equations, linear systems, Laplace transforms, and numerical methods.",
      coursePrice: 280,
      sessionPrice: 45,
    },
  });

  // ── Sessions ──
  const now = new Date();

  // Calculus I Sessions
  const session1 = await prisma.session.upsert({
    where: { id: "seed-session-001" },
    update: {},
    create: {
      id: "seed-session-001",
      title: "Introduction to Limits",
      topic: "Limits & Continuity",
      description: "Understanding what limits are and how to compute them algebraically and graphically.",
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.UPCOMING,
      pricingType: PricingType.COURSE,
      courseId: course1.id,
    },
  });

  const session2 = await prisma.session.upsert({
    where: { id: "seed-session-002" },
    update: {},
    create: {
      id: "seed-session-002",
      title: "Derivatives — Rules & Applications",
      topic: "Derivatives",
      description: "Power rule, chain rule, product rule, and optimization problems.",
      scheduledAt: now, // Live right now!
      durationMin: 90,
      status: SessionStatus.LIVE,
      pricingType: PricingType.COURSE,
      courseId: course1.id,
      zoomLiveEnc: "d3A5cHJvdy56b29tLnVzL2ovMTIzNDU2Nzg5MA==", // Mock encrypted Zoom link
      zoomPasscodeEnc: "MTIzNDU2",
    },
  });

  const session3 = await prisma.session.upsert({
    where: { id: "seed-session-003" },
    update: {},
    create: {
      id: "seed-session-003",
      title: "Integration Basics",
      topic: "Integration",
      description: "Introduction to anti-derivatives, Riemann sums, and the Fundamental Theorem of Calculus.",
      scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.RECORDING,
      pricingType: PricingType.SESSION,
      sessionPrice: 50,
      courseId: course1.id,
      zoomRecordingEnc: "d3A5cHJvdy56b29tLnVzL3JlYy8xMjM0NTY3ODkw",
    },
  });

  const session4 = await prisma.session.upsert({
    where: { id: "seed-session-004" },
    update: {},
    create: {
      id: "seed-session-004",
      title: "Applications of Definite Integrals",
      topic: "Integration",
      description: "Finding area between curves and volumes of solids of revolution.",
      scheduledAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.ENDED,
      pricingType: PricingType.COURSE,
      courseId: course1.id,
    },
  });

  // Linear Algebra Sessions
  const session5 = await prisma.session.upsert({
    where: { id: "seed-session-005" },
    update: {},
    create: {
      id: "seed-session-005",
      title: "Matrix Operations & Determinants",
      topic: "Matrices",
      description: "Row reduction, matrix multiplication, inverses, and determinant properties.",
      scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      durationMin: 75,
      status: SessionStatus.RECORDING,
      pricingType: PricingType.SESSION,
      sessionPrice: 40,
      courseId: course2.id,
      zoomRecordingEnc: "d3A5cHJvdy56b29tLnVzL3JlYy85ODc2NTQzMjE=",
    },
  });

  const session6 = await prisma.session.upsert({
    where: { id: "seed-session-006" },
    update: {},
    create: {
      id: "seed-session-006",
      title: "Vector Spaces & Subspaces",
      topic: "Vector Spaces",
      description: "Understanding linear independence, basis, dimension, and span.",
      scheduledAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.UPCOMING,
      pricingType: PricingType.COURSE,
      courseId: course2.id,
    },
  });

  // Differential Equations Sessions
  const session7 = await prisma.session.upsert({
    where: { id: "seed-session-007" },
    update: {},
    create: {
      id: "seed-session-007",
      title: "First-Order Separable Equations",
      topic: "First-Order ODEs",
      description: "Solving separable differential equations and modeling population growth.",
      scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      durationMin: 90,
      status: SessionStatus.RECORDING,
      pricingType: PricingType.SESSION,
      sessionPrice: 45,
      courseId: course3.id,
      zoomRecordingEnc: "d3A5cHJvdy56b29tLnVzL3JlYy81NTU0NDQzMzM=",
    },
  });

  // ── Enrollments ──
  // Student 1 (Ahmed) is enrolled in Course 1 (Calculus I) and Course 3 (Differential Equations)
  await prisma.enrollment.create({
    data: { userId: student1.id, courseId: course1.id, purchaseType: PurchaseType.COURSE },
  });

  await prisma.enrollment.create({
    data: { userId: student1.id, courseId: course3.id, purchaseType: PurchaseType.COURSE },
  });

  // Student 1 is also enrolled in an individual session from Course 2 (Linear Algebra)
  await prisma.enrollment.create({
    data: { userId: student1.id, sessionId: session5.id, purchaseType: PurchaseType.SESSION },
  });

  // Student 2 (Lina) is enrolled in Course 2 (Linear Algebra) and Course 1 (Calculus I)
  await prisma.enrollment.create({
    data: { userId: student2.id, courseId: course2.id, purchaseType: PurchaseType.COURSE },
  });

  await prisma.enrollment.create({
    data: { userId: student2.id, courseId: course1.id, purchaseType: PurchaseType.COURSE },
  });

  // Also seed some initial mock payments for Total Revenue calculation
  await prisma.payment.create({
    data: {
      userId: student1.id,
      amount: 300,
      currency: "USD",
      type: PurchaseType.COURSE,
      status: PaymentStatus.PAID,
      paytabsRef: "REF-CALC-I",
      receiptUrl: "https://receipts.mathhub.app/seed-1.pdf",
      paidAt: now,
    },
  });

  await prisma.payment.create({
    data: {
      userId: student1.id,
      amount: 40,
      currency: "USD",
      type: PurchaseType.SESSION,
      status: PaymentStatus.PAID,
      paytabsRef: "REF-LA-5",
      receiptUrl: "https://receipts.mathhub.app/seed-2.pdf",
      paidAt: now,
    },
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
