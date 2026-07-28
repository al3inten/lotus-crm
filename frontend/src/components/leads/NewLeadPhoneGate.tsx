import { useEffect, useState } from "react";
import { Check, ExternalLink, Search, UserCircle2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { PhoneInput } from "../common/PhoneInput";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useLeadLookup } from "../../hooks/useLeads";
import { useAuth } from "../../context/AuthContext";
import type { AddLeadFormValues } from "../../schemas/lead.schema";

interface NewLeadPhoneGateProps {
  isOpen: boolean;
  onClose: () => void;
  /** Hands the intake wizard its starting values — phone alone for a brand-new customer,
   * or the known profile for a returning one. */
  onContinue: (initialValues: Partial<AddLeadFormValues>) => void;
}

/**
 * Every new enquiry starts from the mobile number, because the number is the identity key
 * the whole dedupe rule hangs off. Checking it up front means the CR either lands in a
 * blank form or in one already carrying the customer's saved profile — they never retype
 * details the CRM already has, and never discover the duplicate only at save time.
 */
export function NewLeadPhoneGate({ isOpen, onClose, onContinue }: NewLeadPhoneGateProps) {
  const [phone, setPhone] = useState("");
  const [checked, setChecked] = useState(false);
  const { user } = useAuth();

  // Same condition the API honours `forceNew` for — see leads.controller.ts withCheckedForceNew.
  const canForceNew =
    !!user && (user.role === "SUPER_ADMIN" || (user.permissions.leads === "write" && !user.restrictLeadsToOwn));

  const isValid = isValidPhoneNumber(phone);
  const { data: lookupResult, isFetching } = useLeadLookup(isValid ? phone : "");

  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setChecked(false);
    }
  }, [isOpen]);

  // Editing the number invalidates whatever the previous check showed.
  const onPhoneChange = (value: string) => {
    setPhone(value);
    setChecked(false);
  };

  const showResult = checked && isValid && !isFetching;
  const existing = showResult ? lookupResult : null;

  const continueAsNewCustomer = () => onContinue({ phone: phone } as Partial<AddLeadFormValues>);

  const continueWithExistingCustomer = () => {
    if (!lookupResult) return;
    onContinue({
      phone: phone,
      name: lookupResult.name,
      email: lookupResult.email ?? undefined,
      alternateMobile: lookupResult.alternateMobile ?? undefined,
      dob: lookupResult.dob ? lookupResult.dob.slice(0, 10) : undefined,
      profession: lookupResult.profession ?? undefined,
      pincode: lookupResult.pincode ?? undefined,
      area: lookupResult.area ?? undefined,
      address: lookupResult.address ?? undefined,
      location: lookupResult.location ?? undefined,
      department: lookupResult.department ?? undefined,
      // The operator has just been shown the existing customer and chosen to raise a
      // separate enquiry anyway, so the duplicate block is pre-cleared — but only for the
      // roles the API accepts it from; everyone else still hits the block in the wizard.
      forceNew: canForceNew && lookupResult.enquiryCount > 0,
    } as Partial<AddLeadFormValues>);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Enquiry"
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {!showResult && (
            <Button
              type="button"
              icon={<Search size={15} />}
              disabled={!isValid}
              isLoading={checked && isFetching}
              onClick={() => setChecked(true)}
            >
              Check Number
            </Button>
          )}
          {showResult && existing && (
            <Button type="button" icon={<Check size={15} />} onClick={continueWithExistingCustomer}>
              New enquiry for this customer
            </Button>
          )}
          {showResult && !existing && (
            <Button type="button" icon={<Check size={15} />} onClick={continueAsNewCustomer}>
              Continue
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Start with the customer's mobile number — we'll check whether they're already in the CRM.
        </p>

        <PhoneInput
          label="Mobile Number"
          required
          autoFocus
          value={phone}
          onChange={onPhoneChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid) setChecked(true);
          }}
          error={
            phone.replace(/\D/g, "").length > 3 && !isValid
              ? "Enter a valid mobile number for the selected country"
              : undefined
          }
        />

        {checked && isFetching && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Checking…</p>
        )}

        {showResult && existing && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
              <UserCircle2 size={16} /> Existing customer: {existing.name}
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              {existing.enquiryCount} enquiry(ies) on record
              {existing.hasActiveEnquiry
                ? ` — one is still active in the ${existing.activeEnquiryStatus?.replaceAll("_", " ")} stage.`
                : " — all closed."}{" "}
              Their saved details will be pre-filled on the next screen.
              {!canForceNew && existing.enquiryCount > 0 && (
                <> Saving a second enquiry needs a manager's override.</>
              )}
            </p>
            {existing.hasActiveEnquiry && existing.activeEnquiryId && (
              <a
                href={`/leads/${existing.leadId}/enquiries/${existing.activeEnquiryId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
              >
                <ExternalLink size={13} /> Open the active enquiry instead
              </a>
            )}
          </div>
        )}

        {showResult && !existing && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              <Check size={16} /> New customer — no record found for this number.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
