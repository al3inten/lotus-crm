import { Controller } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { Building2 } from "lucide-react";
import { Select, Input } from "../../common/Input";
import { SearchableSelect } from "../../common/SearchableSelect";
import { Card, CardHeader } from "../../common/Card";
import type { AddLeadFormInput } from "../../../schemas/lead.schema";
import { DEPARTMENTS, SOURCE_CATEGORIES } from "../../../types";
import type { useBranches } from "../../../hooks/useBranches";
import type { useBranchStaff } from "../../../hooks/useUsers";

interface Step1EnquirySourceProps {
  control: Control<AddLeadFormInput>;
  register: UseFormRegister<AddLeadFormInput>;
  fieldError: (name: keyof AddLeadFormInput) => string | undefined;
  setValue: (name: keyof AddLeadFormInput, value: unknown) => void;
  isComplete: boolean;
  branches: ReturnType<typeof useBranches>["data"];
  crStaff: ReturnType<typeof useBranchStaff>["data"];
  subsourceOptions: readonly string[];
  selectedSourceCategory?: string;
  sectionTitle: string;
  sectionIconClassName: string;
}

export function Step1EnquirySource({
  control,
  register,
  fieldError,
  setValue,
  isComplete,
  branches,
  crStaff,
  subsourceOptions,
  selectedSourceCategory,
  sectionTitle,
  sectionIconClassName,
}: Step1EnquirySourceProps) {
  return (
    <Card>
      <CardHeader
        icon={<Building2 size={18} />}
        title={sectionTitle}
        subtitle="Where this enquiry came from and who's handling it."
        iconClassName={sectionIconClassName}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isComplete ? (
          <p className="sm:col-span-2 text-sm text-slate-500 dark:text-slate-400">
            Branch, source, and assigned CR are already set for this enquiry — fill in department/sub-source
            below if known.
          </p>
        ) : (
          <>
            <Controller
              control={control}
              name="branchId"
              render={({ field }) => (
                <SearchableSelect
                  ref={field.ref}
                  label="Dealer / Branch"
                  required
                  placeholder="Search branches…"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldError("branchId")}
                  options={branches?.map((b) => ({ value: b.id, label: `${b.code} — ${b.name}` })) ?? []}
                />
              )}
            />
            <Controller
              control={control}
              name="assignedCrId"
              render={({ field }) => (
                <SearchableSelect
                  ref={field.ref}
                  label="CR (handled by)"
                  placeholder="Search CRs…"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldError("assignedCrId")}
                  options={crStaff?.map((cr) => ({ value: cr.id, label: cr.name })) ?? []}
                />
              )}
            />
          </>
        )}
        <Select label="Department" error={fieldError("department")} {...register("department")}>
          <option value="">Select department</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select
          label="Lead Source"
          required
          error={fieldError("sourceCategory")}
          {...register("sourceCategory", { onChange: () => setValue("subsource", "") })}
        >
          <option value="">Select source</option>
          {SOURCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select label="Subsource" required error={fieldError("subsource")} {...register("subsource")}>
          <option value="">Select subsource</option>
          {subsourceOptions.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        {selectedSourceCategory === "REFERRAL" && (
          <Input
            label="Referrer Name"
            required
            placeholder="Name of the customer/employee who referred this lead"
            error={fieldError("referrerName")}
            {...register("referrerName")}
          />
        )}

        {!isComplete && (
          <div className="sm:col-span-2 mt-1 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Enquiry date: {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
