"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface FaqAccordionItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * FAQ accordion (content resolved server-side from the database). Reused by
 * the Location page and the Help page — the section header lives with each
 * page.
 */
export function FaqAccordion({
  items,
  className,
}: {
  items: FaqAccordionItem[];
  className?: string;
}) {

  return (
    <Accordion
      defaultValue={items.length > 0 ? [items[0].id] : undefined}
      className={cn(
        "rounded-2xl bg-card px-2 ring-1 ring-gp-olive/10 sm:px-3",
        className
      )}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="not-last:border-b-gp-olive/10 px-3 sm:px-4"
        >
          <AccordionTrigger className="font-heading py-4 text-base font-semibold hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="max-w-3xl leading-relaxed text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
