/**
 * FAQ service (PRD Fase 3: Bantuan): bilingual question/answer pairs for the
 * Location and Help pages.
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { pick } from "@/data/localized";

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
}

export interface ListFaqsOptions {
  locale: string;
}

/** Lists active FAQ entries in display order, resolved for one locale. */
export async function listFaqs(options: ListFaqsOptions): Promise<FaqDto[]> {
  const rows = await db
    .select()
    .from(schema.faqs)
    .orderBy(asc(schema.faqs.sortOrder));

  return rows
    .filter((faq) => faq.isActive)
    .map((faq) => ({
      id: faq.id,
      question: pick(options.locale, {
        id: faq.questionId,
        en: faq.questionEn,
      }),
      answer: pick(options.locale, { id: faq.answerId, en: faq.answerEn }),
    }));
}
