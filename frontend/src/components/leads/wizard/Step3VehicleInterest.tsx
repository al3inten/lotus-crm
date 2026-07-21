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
  selectedModelName: string | undefined;
  modelOptions: SelectOption[];
  variantOptionsList: SelectOption[];
  enquiryCategoryOptions: readonly string[];
  sectionTitle: string;
  sectionIconClassName: string;
}

export function Step3VehicleInterest({
  control,
  register,
  fieldError,
  setValue,
  isComplete,
  selectedModelName,
  modelOptions,
  variantOptionsList,
  enquiryCategoryOptions,
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
              disabled={isComplete}
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
              disabled={isComplete || !selectedModelName}
              placeholder="Search variants…"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldError("variant")}
              options={variantOptionsList}
            />
          )}
        />
        <Select label="Lead Type" required disabled={isComplete} error={fieldError("enquiryType")} {...register("enquiryType")}>
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
      </div>
    </Card>
  );
}
