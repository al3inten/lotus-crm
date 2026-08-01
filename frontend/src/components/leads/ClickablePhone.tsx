import type { ReactNode } from "react";

/**
 * Wraps a phone number as a tel: link inside rows/cards that also have their own
 * onClick (open lead) — stopPropagation keeps a tap on the number from opening the lead.
 */
export function ClickablePhone({
  phone,
  children,
}: {
  phone: string;
  leadId: string;
  enquiryId: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
      className="hover:text-primary-600 hover:underline dark:hover:text-primary-400"
    >
      {children}
    </a>
  );
}
