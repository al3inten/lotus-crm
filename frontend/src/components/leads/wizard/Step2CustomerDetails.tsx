import { Controller } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { UserCircle2 } from "lucide-react";
import { Input, Textarea } from "../../common/Input";
import { PhoneInput } from "../../common/PhoneInput";
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
  cityLoading: boolean;
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
  cityLoading,
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
        <Input label="Customer Name" required error={fieldError("name")} {...register("name")} />
        <div className="relative">
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                label="Mobile Number"
                required
                disabled={isComplete}
                error={fieldError("phone")}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
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
              captionLayout="dropdown"
              startMonth={new Date(1940, 0)}
              endMonth={new Date()}
            />
          )}
        />
        <Input label="Profession" error={fieldError("profession")} {...register("profession")} />
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
        <div className="relative">
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <TypeaheadInput
                label="City"
                required
                error={fieldError("location")}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                suggestions={citySuggestions}
              />
            )}
          />
          {cityLoading && (
            <div className="absolute right-3 top-[38px]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          )}
        </div>
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
        <div className="sm:col-span-2">
          <Textarea label="Address" rows={2} error={fieldError("address")} {...register("address")} />
        </div>
      </div>
    </Card>
  );
}
