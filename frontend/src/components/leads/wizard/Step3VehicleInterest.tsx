import { Controller } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { Car } from "lucide-react";
import { Select } from "../../common/Input";
import { SearchableSelect } from "../../common/SearchableSelect";
import { Card, CardHeader } from "../../common/Card";
import type { AddLeadFormInput } from "../../../schemas/lead.schema";
import { ENQUIRY_TYPES } from "../../../types";
interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface Step3VehicleInterestProps {
  control: Control<AddLeadFormInput>;
  register: UseFormRegister<AddLeadFormInput>;
  fieldError: (name: keyof AddLeadFormInput) => string | undefined;
  setValue: (name: keyof AddLeadFormInput, value: unknown) => void;
  isComplete: boolean;
  /** Supervisors only — the API rejects the flag from anyone else. */
  canForceNew: boolean;
  selectedModelName: string | undefined;
  modelOptions: SelectOption[];
  variantOptionsList: SelectOption[];
  enquiryCategoryOptions: readonly string[];
  consultantOptions: SelectOption[];
  sectionTitle: string;
  sectionIconClassName: string;
}

export function Step3VehicleInterest({
  control,
  register,
  fieldError,
  setValue,
  isComplete,
  canForceNew,
  selectedModelName,
  modelOptions,
  variantOptionsList,
  enquiryCategoryOptions,
  consultantOptions,
  sectionTitle,
  sectionIconClassName,
}: Step3VehicleInterestProps) {
  return (
    <Card>
      <CardHeader
        icon={<Car size={18} />}
        title={sectionTitle}
        subtitle="The car they're after and how they'll pay for it."
        iconClassName={sectionIconClassName}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="carModel"
          render={({ field }) => (
            <SearchableSelect
              ref={field.ref}
              label="Vehicle Model"
              required
              placeholder="Search models…"
              value={field.value}
              onChange={(v) => {
                field.onChange(v);
                setValue("variant", "");
              }}
              onBlur={field.onBlur}
              error={fieldError("carModel")}
              options={modelOptions}
            />
          )}
        />
        <Controller
          control={control}
          name="variant"
          render={({ field }) => (
            <SearchableSelect
              ref={field.ref}
              label="Variant"
              disabled={!selectedModelName}
              placeholder="Search variants…"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldError("variant")}
              options={variantOptionsList}
            />
          )}
        />
        <Select label="Lead Type" required error={fieldError("enquiryType")} {...register("enquiryType")}>
          {ENQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select label="Enquiry Category" error={fieldError("enquiryCategory")} {...register("enquiryCategory")}>
          <option value="">Select category</option>
          {enquiryCategoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        {/* Showroom consultant for this customer — optional at intake, reassignable here too. */}
        <Select label="Consultant" error={fieldError("consultantId")} {...register("consultantId")}>
          <option value="">
            {consultantOptions.length === 0 ? "No consultants in this branch" : "Select consultant"}
          </option>
          {consultantOptions.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>

        {/* Sits on the last required step, next to the Save button, so the duplicate block
            can be cleared right where it bites. Overriding it is a supervisor call — the
            API enforces the same rule regardless of this checkbox. */}
        {!isComplete && canForceNew && (
          <div className="sm:col-span-2 mt-1 border-t border-slate-100 pt-4 dark:border-slate-800">
            <label className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
              <input type="checkbox" {...register("forceNew")} className="rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
              <span className="font-medium">Force new enquiry</span>
            </label>
          </div>
        )}
      </div>
    </Card>
  );
}
