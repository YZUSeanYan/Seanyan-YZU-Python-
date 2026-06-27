import type { Question } from '@/types';

export function normalizeChoiceAnswer(answer: string | string[] | undefined | null) {
  const raw = Array.isArray(answer) ? answer[0] : answer;
  const trimmed = String(raw ?? '').trim();
  const match = trimmed.match(/^([A-D])(?:[.\s、．]|$)/i);
  return match ? match[1].toUpperCase() : trimmed.toUpperCase();
}

export function normalizeTextAnswer(answer: string | string[] | undefined | null) {
  const raw = Array.isArray(answer) ? answer.join('|') : answer;
  return String(raw ?? '')
    .trim()
    .replace(/[，]/g, ',')
    .replace(/[；]/g, ';')
    .replace(/[：]/g, ':')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/[【]/g, '[')
    .replace(/[】]/g, ']')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function isQuestionAnswerCorrect(question: Question, answer?: string | null) {
  if (!answer) return false;

  if (question.type === 'single') {
    const correctAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
    return normalizeChoiceAnswer(answer) === normalizeChoiceAnswer(correctAnswer);
  }

  if (Array.isArray(question.answer)) {
    const answerParts = answer.split('|').map((part) => normalizeTextAnswer(part));
    return question.answer.every((part, index) => answerParts[index] === normalizeTextAnswer(String(part)));
  }

  return normalizeTextAnswer(answer) === normalizeTextAnswer(question.answer);
}
