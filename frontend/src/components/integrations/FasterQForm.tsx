import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { CopyableField } from "../common/CopyableField";
import { VerifyTokenField } from "./VerifyTokenField";
import { fasterqCredentialsFormSchema } from "../../schemas/integration.schema";
import type { FasterqCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";
import { getFasterqWebhookUrl } from "./webhookUrl";

export function FasterQForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FasterqCredentialsFormValues>({ resolver: zodResolver(fasterqCredentialsFormSchema) });
  const { onChange: _verifyTokenOnChange, ...verifyTokenField } = register("verifyToken");

  const onSubmit = (values: FasterqCredentialsFormValues) => {
    saveIntegration.mutate({ key: "FASTERQ", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Connects LotusCRM to FasterQ for call recordings and transcripts, matched to leads by phone number. Paste
        your API key below, and set the callback URL in FasterQ's dashboard using the same Verify Token.
      </p>
      <Input label="API Key" type="password" error={errors.apiKey?.message} {...register("apiKey")} />
      <CopyableField label="Callback URL" value={getFasterqWebhookUrl()} />
      <VerifyTokenField
        value={watch("verifyToken") ?? ""}
        error={errors.verifyToken?.message}
        onChange={(v) => setValue("verifyToken", v, { shouldValidate: true, shouldDirty: true })}
        inputProps={verifyTokenField}
      />
      {saveIntegration.isError && (
        <p className="text-sm text-red-600">Failed to save — check the values and try again.</p>
      )}
      <Button type="submit" isLoading={saveIntegration.isPending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
