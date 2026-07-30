import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { CopyableField } from "../common/CopyableField";
import { VerifyTokenField } from "./VerifyTokenField";
import { whatsappCredentialsFormSchema } from "../../schemas/integration.schema";
import type { WhatsappCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";
import { getMetaWebhookUrl } from "./webhookUrl";

export function WhatsappForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WhatsappCredentialsFormValues>({ resolver: zodResolver(whatsappCredentialsFormSchema) });
  // Generate needs to set the field imperatively — pull register()'s own onChange out so it
  // doesn't fight the controlled value/onChange VerifyTokenField manages.
  const { onChange: _verifyTokenOnChange, ...verifyTokenField } = register("verifyToken");

  const onSubmit = (values: WhatsappCredentialsFormValues) => {
    saveIntegration.mutate({ key: "WHATSAPP", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        In WhatsApp Business Platform settings, subscribe to <strong>messages</strong> and set the callback URL below,
        using the same Verify Token you enter below.
      </p>
      <CopyableField label="Callback URL" value={getMetaWebhookUrl()} />
      <Input label="Phone Number ID" error={errors.phoneNumberId?.message} {...register("phoneNumberId")} />
      <Input label="Access Token" type="password" error={errors.accessToken?.message} {...register("accessToken")} />
      <Input label="App Secret" type="password" error={errors.appSecret?.message} {...register("appSecret")} />
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
