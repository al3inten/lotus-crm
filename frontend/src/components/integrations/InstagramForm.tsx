import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { CopyableField } from "../common/CopyableField";
import { instagramCredentialsFormSchema } from "../../schemas/integration.schema";
import type { InstagramCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";
import { getMetaWebhookUrl } from "./webhookUrl";

export function InstagramForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstagramCredentialsFormValues>({ resolver: zodResolver(instagramCredentialsFormSchema) });

  const onSubmit = (values: InstagramCredentialsFormValues) => {
    saveIntegration.mutate({ key: "INSTAGRAM", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Subscribe your Instagram professional account to <strong>messages</strong> and set the callback URL below,
        using the same Verify Token you enter below. Note: Instagram DMs don't include a phone number — captured
        conversations land in the Social Inbox for manual conversion.
      </p>
      <CopyableField label="Callback URL" value={getMetaWebhookUrl()} />
      <Input
        label="Instagram Business Account ID"
        error={errors.instagramBusinessAccountId?.message}
        {...register("instagramBusinessAccountId")}
      />
      <Input label="Access Token" type="password" error={errors.accessToken?.message} {...register("accessToken")} />
      <Input label="App Secret" type="password" error={errors.appSecret?.message} {...register("appSecret")} />
      <Input label="Webhook Verify Token" error={errors.verifyToken?.message} {...register("verifyToken")} />
      {saveIntegration.isError && (
        <p className="text-sm text-red-600">Failed to save — check the values and try again.</p>
      )}
      <Button type="submit" isLoading={saveIntegration.isPending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
