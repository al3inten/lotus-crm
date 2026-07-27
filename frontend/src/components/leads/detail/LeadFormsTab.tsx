import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Car, ClipboardCheck, ArrowRightLeft, FileText, PackageCheck } from "lucide-react";
import clsx from "clsx";

import { Card } from "../../common/Card";
import { TestDriveForm } from "../../enquiry/TestDriveForm";
import { BookingDetailsForm } from "../../enquiry/BookingDetailsForm";
import { DeliveryDateCard } from "../../enquiry/DeliveryDateCard";
import { ExchangeForm } from "../../enquiry/ExchangeForm";
import { QuotationForm } from "../../enquiry/QuotationForm";

import { fadeUp } from "../../../lib/motion";
import type { Enquiry } from "../../../types";

const SUB_TABS = ["testdrive", "booking", "delivery", "exchange", "quotation"] as const;
type SubTab = (typeof SUB_TABS)[number];

const SUB_TAB_ICONS: Record<SubTab, typeof Car> = {
  testdrive: Car,
  booking: ClipboardCheck,
  delivery: PackageCheck,
  exchange: ArrowRightLeft,
  quotation: FileText,
};

const SUB_TAB_LABELS: Record<SubTab, string> = {
  testdrive: "Test Drive",
  booking: "Booking Details",
  delivery: "Delivery Details",
  exchange: "Exchange",
  quotation: "Quotation",
};

/** Every tab pane is this exact height — a scrollable body — so switching tabs never
 * resizes the card, matching the Activity and Details cards' sub-tabs. */
const PANEL_HEIGHT = "h-[380px]";

interface LeadFormsTabProps {
  enquiry: Enquiry;
  testDriveEditable: boolean;
  bookingEditable: boolean;
  deliveryEditable: boolean;
  exchangeEditable: boolean;
  quotationEditable: boolean;
  showQuotation: boolean;
  lockedHint: (stage: string) => string;
}

export function LeadFormsTab({
  enquiry,
  testDriveEditable,
  bookingEditable,
  deliveryEditable,
  exchangeEditable,
  quotationEditable,
  showQuotation,
  lockedHint,
}: LeadFormsTabProps) {
  const tabs = showQuotation ? SUB_TABS : SUB_TABS.filter((t) => t !== "quotation");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("testdrive");

  return (
    <motion.div variants={fadeUp}>
      <Card padded={false} glow={false} className="overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3 [scrollbar-width:thin] dark:border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = SUB_TAB_ICONS[tab];
            const active = activeSubTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSubTab(tab)}
                className={clsx(
                  "relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3.5 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500",
                  active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="formsSubTab"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-primary-500"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon size={13} strokeWidth={1.75} />
                {SUB_TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className={clsx(PANEL_HEIGHT, "overflow-y-auto [scrollbar-width:thin]")}>
                {activeSubTab === "testdrive" && (
                  <TestDriveForm
                    enquiryId={enquiry.id}
                    branchId={enquiry.branchId}
                    existing={enquiry.testDriveFeedbacks}
                    defaultCarModel={enquiry.carModel}
                    defaultVariant={enquiry.variant}
                    editable={testDriveEditable}
                    lockedHint={lockedHint("Appointment Fixed")}
                  />
                )}
                {activeSubTab === "booking" && (
                  <BookingDetailsForm enquiry={enquiry} editable={bookingEditable} lockedHint={lockedHint("Booked")} />
                )}
                {activeSubTab === "delivery" && (
                  <DeliveryDateCard enquiry={enquiry} editable={deliveryEditable} lockedHint={lockedHint("Delivered")} />
                )}
                {activeSubTab === "exchange" && (
                  <ExchangeForm
                    enquiryId={enquiry.id}
                    branchId={enquiry.branchId}
                    existing={enquiry.exchangeEvaluation}
                    editable={exchangeEditable}
                    lockedHint={lockedHint("Booked")}
                  />
                )}
                {activeSubTab === "quotation" && showQuotation && (
                  <QuotationForm
                    enquiryId={enquiry.id}
                    branchId={enquiry.branchId}
                    existing={enquiry.quotation}
                    editable={quotationEditable}
                    lockedHint={lockedHint("Test Drive")}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
