import { Controller } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { UserCircle2 } from "lucide-react";
import { Input, Textarea } from "../../common/Input";
import { DatePickerField } from "../../common/DateTimePicker";
import { Card, CardHeader } from "../../common/Card";
import { TypeaheadInput } from "../../common/TypeaheadInput";
import type { TypeaheadOption } from "../../common/TypeaheadInput";
import type { AddLeadFormInput } from "../../../schemas/lead.schema";

interface Step2CustomerDetailsProps {
  control: Control<AddLeadFormInput>;
  register: UseFormRegister<AddLeadFormInput>;
  fieldError: (name: keyof AddLeadFormInput) => string | undefined;
  isComplete: boolean;
  lookupLoading: boolean;
  citySuggestions: TypeaheadOption[];
  areaSuggestions: TypeaheadOption[];
  pincodeSuggestions: TypeaheadOption[];
  sectionTitle: string;
  sectionIconClassName: string;
}

export function Step2CustomerDetails({
  control,
  register,
  fieldError,
  isComplete,
  lookupLoading,
  citySuggestions,
  areaSuggestions,
  pincodeSuggestions,
  sectionTitle,
  sectionIconClassName,
}: Step2CustomerDetailsProps) {
  return (
    <Card>
      <CardHeader
        icon={<UserCircle2 size={18} />}
        title={sectionTitle}
        subtitle="Who the customer is and how to reach them."
        iconClassName={sectionIconClassName}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Customer Name" required disabled={isComplete} error={fieldError("name")} {...register("name")} />
        <div className="relative">
          <Input label="Mobile Number" required disabled={isComplete} error={fieldError("phone")} {...register("phone")} />
          {lookupLoading && (
            <div className="absolute right-3 top-[38px]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          )}
        </div>
        <Input label="Alternate mobile" error={fieldError("alternateMobile")} {...register("alternateMobile")} />
        <Input label="Email" placeholder='name@example.com or "Nil"' required error={fieldError("email")} {...register("email")} />
        <Controller
          control={control}
          name="dob"
          render={({ field }) => (
            <DatePickerField
              label="Date of birth"
              value={field.value}
              onChange={field.onChange}
              error={fieldError("dob")}
            />
          )}
        />
        <Input label="Profession" error={fieldError("profession")} {...register("profession")} />
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <TypeaheadInput
              label="City"
              required
              disabled={isComplete}
              error={fieldError("location")}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              suggestions={citySuggestions}
            />
          )}
        />
        <Controller
          control={control}
          name="area"
          render={({ field }) => (
            <TypeaheadInput
              label="Area"
              required
              placeholder="e.g. Peelamedu"
              error={fieldError("area")}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              suggestions={areaSuggestions}
            />
          )}
        />
        <Controller
          control={control}
          name="pincode"
          render={({ field }) => (
            <TypeaheadInput
              label="Pincode"
              required
              error={fieldError("pincode")}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              suggestions={pincodeSuggestions}
            />
          )}
        />
        <div className="sm:col-span-2">
          <Textarea label="Address" rows={2} error={fieldError("address")} {...register("address")} />
        </div>
      </div>
    </Card>
  );
}
