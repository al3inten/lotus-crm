import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { callmaticCredentialsFormSchema } from "../../schemas/integration.schema";
import type { CallmaticCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";

export function CallmaticForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CallmaticCredentialsFormValues>({ resolver: zodResolver(callmaticCredentialsFormSchema) });

  const onSubmit = (values: CallmaticCredentialsFormValues) => {
    saveIntegration.mutate({ key: "CALLMATIC", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Connects LotusCRM to    for automated outbound voice campaigns. You can find your API key and Campaign ID in the Callmatic Dashboard.
      </p>
      <Input label="API Key" type="password" error={errors.apiKey?.message} {...register("apiKey")} />
      <Input label="Campaign ID" error={errors.campaignId?.message} {...register("campaignId")} />

      {saveIntegration.isError && (
        <p className="text-sm text-red-600">Failed to save — check the values and try again.</p>
      )}
      <Button type="submit" isLoading={saveIntegration.isPending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
