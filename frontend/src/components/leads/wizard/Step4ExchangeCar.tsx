import { Controller } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Input } from "../../common/Input";
import { YearPicker } from "../../common/DateTimePicker";
import { Switch } from "../../common/Switch";
import { Card, CardHeader } from "../../common/Card";
import type { AddLeadFormInput } from "../../../schemas/lead.schema";
import { collapseProps } from "../AddLeadWizard";

interface Step4ExchangeCarProps {
  register: UseFormRegister<AddLeadFormInput>;
  fieldError: (name: keyof AddLeadFormInput) => string | undefined;
  control: Control<AddLeadFormInput>;
  hasExchangeVehicle: boolean;
  toggleExchangeVehicle: (val: boolean) => void;
  sectionTitle: string;
  sectionIconClassName: string;
}

export function Step4ExchangeCar({
  register,
  fieldError,
  control,
  hasExchangeVehicle,
  toggleExchangeVehicle,
  sectionTitle,
  sectionIconClassName,
}: Step4ExchangeCarProps) {
  return (
    <Card>
      <CardHeader
        icon={<RefreshCw size={18} />}
        title={sectionTitle}
        subtitle="Optional — only if the customer mentioned an exchange vehicle."
        iconClassName={sectionIconClassName}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Switch
            checked={hasExchangeVehicle}
            onChange={toggleExchangeVehicle}
            label="Do you have a vehicle for exchange?"
            description="Switch on to capture the customer's exchange vehicle details."
          />
        </div>
        <AnimatePresence initial={false}>
          {hasExchangeVehicle && (
            <motion.div key="exchange-fields" {...collapseProps}>
              <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                <Input label="Model name" required error={fieldError("exchangeCarModel")} {...register("exchangeCarModel")} />
                <Controller
                  control={control}
                  name="exchangeCarYear"
                  render={({ field }) => (
                    <YearPicker
                      label="Year"
                      required
                      value={field.value as number | string | undefined}
                      onChange={field.onChange}
                      error={fieldError("exchangeCarYear")}
                    />
                  )}
                />
                <Input label="KMs driven" type="number" required min={0} error={fieldError("exchangeCarKms")} {...register("exchangeCarKms")} />
                <Input label="No. of owners" type="number" required min={0} error={fieldError("exchangeCarOwners")} {...register("exchangeCarOwners")} />
                <Input
                  label="Car Register Number"
                  required
                  placeholder="e.g. TN 37 AB 1234"
                  error={fieldError("exchangeCarRegNumber")}
                  {...register("exchangeCarRegNumber")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
