import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { whatsappCredentialsFormSchema } from "../../schemas/integration.schema";
import type { WhatsappCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";
import { getMetaWebhookUrl } from "./webhookUrl";

export function WhatsappForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WhatsappCredentialsFormValues>({ resolver: zodResolver(whatsappCredentialsFormSchema) });

  const onSubmit = async (values: WhatsappCredentialsFormValues) => {
    await saveIntegration.mutateAsync({ key: "WHATSAPP", credentials: values });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        In WhatsApp Business Platform settings, subscribe to <strong>messages</strong> and set the callback URL to{" "}
        <code className="break-all">{getMetaWebhookUrl()}</code>, using the same Verify Token you enter below.
      </p>
      <Input label="Phone Number ID" error={errors.phoneNumberId?.message} {...register("phoneNumberId")} />
      <Input label="Access Token" type="password" error={errors.accessToken?.message} {...register("accessToken")} />
      <Input label="App Secret" type="password" error={errors.appSecret?.message} {...register("appSecret")} />
      <Input label="Webhook Verify Token" error={errors.verifyToken?.message} {...register("verifyToken")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save
      </Button>
    </form>
  );
}
