import { AttemptStatus, QuestionType } from "@prisma/client";
import { prisma } from "../config/database";

/**
 * Auto-grades a quiz attempt after submission.
 * - MULTIPLE_CHOICE: compares choiceId to Choice.isCorrect → sets isCorrect + pointsEarned
 * - TEXT_ANSWER: marks as null (needs manual grading) unless correctText is set (fuzzy match)
 * - MEDIA_UPLOAD: marks as null (needs manual grading)
 * - MIXED: MC portion auto-graded; text/media portion manual
 *
 * Sets attempt.score, attempt.maxScore.
 * If all questions are auto-gradeable → status = GRADED. Otherwise → SUBMITTED.
 */
export async function autoGradeAttempt(attemptId: string): Promise<void> {
  const attempt = await prisma.quizAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { choices: true },
          },
        },
      },
      answers: { include: { choice: true } },
    },
  });

  let totalScore = 0;
  let maxScore = 0;
  let hasManualQuestions = false;

  const updates: Array<Promise<unknown>> = [];

  for (const q of attempt.quiz.questions) {
    const answer = attempt.answers.find((item) => item.questionId === q.id);
    maxScore += q.points;
    if (!answer) continue;

    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      const isCorrect = answer.choice?.isCorrect ?? false;
      const pointsEarned = isCorrect ? q.points : 0;
      totalScore += pointsEarned;
      updates.push(
        prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect, pointsEarned },
        })
      );
    } else if (q.type === QuestionType.TEXT_ANSWER && q.correctText) {
      // Fuzzy match — case-insensitive trim
      const submitted = (answer.textAnswer ?? "").trim().toLowerCase();
      const correct = q.correctText.trim().toLowerCase();
      const isCorrect = submitted === correct;
      const pointsEarned = isCorrect ? q.points : 0;
      totalScore += pointsEarned;
      updates.push(
        prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect, pointsEarned },
        })
      );
    } else {
      // TEXT_ANSWER without correctText, MEDIA_UPLOAD, MIXED → needs manual review
      hasManualQuestions = true;
    }
  }

  await Promise.all(updates);

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score: totalScore,
      maxScore,
      status: hasManualQuestions ? AttemptStatus.SUBMITTED : AttemptStatus.GRADED,
      submittedAt: new Date(),
    },
  });
}

/**
 * Manually grades text/media answers in a quiz attempt.
 * grades: array of { answerId, pointsEarned, isCorrect }
 * After grading all, recomputes total score and marks attempt GRADED.
 */
export async function manualGradeAttempt(
  attemptId: string,
  grades: Array<{ answerId: string; pointsEarned: number; isCorrect: boolean }>
): Promise<void> {
  await Promise.all(
    grades.map((g) =>
      prisma.answer.update({
        where: { id: g.answerId },
        data: { pointsEarned: g.pointsEarned, isCorrect: g.isCorrect },
      })
    )
  );

  // Recompute total score
  const allAnswers = await prisma.answer.findMany({
    where: { attemptId },
    include: { question: true },
  });

  const maxScore = allAnswers.reduce((sum, a) => sum + a.question.points, 0);
  const score = allAnswers.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
  const allGraded = allAnswers.every((a) => a.isCorrect !== null);

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      maxScore,
      status: allGraded ? AttemptStatus.GRADED : AttemptStatus.SUBMITTED,
    },
  });
}
