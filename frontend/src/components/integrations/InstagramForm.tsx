import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { instagramCredentialsFormSchema } from "../../schemas/integration.schema";
import type { InstagramCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";
import { getMetaWebhookUrl } from "./webhookUrl";

export function InstagramForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstagramCredentialsFormValues>({ resolver: zodResolver(instagramCredentialsFormSchema) });

  const onSubmit = async (values: InstagramCredentialsFormValues) => {
    await saveIntegration.mutateAsync({ key: "INSTAGRAM", credentials: values });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Subscribe your Instagram professional account to <strong>messages</strong> and set the callback URL to{" "}
        <code className="break-all">{getMetaWebhookUrl()}</code>, using the same Verify Token you enter below. Note:
        Instagram DMs don't include a phone number — captured conversations land in the Social Inbox for manual
        conversion.
      </p>
      <Input
        label="Instagram Business Account ID"
        error={errors.instagramBusinessAccountId?.message}
        {...register("instagramBusinessAccountId")}
      />
      <Input label="Access Token" type="password" error={errors.accessToken?.message} {...register("accessToken")} />
      <Input label="App Secret" type="password" error={errors.appSecret?.message} {...register("appSecret")} />
      <Input label="Webhook Verify Token" error={errors.verifyToken?.message} {...register("verifyToken")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save
      </Button>
    </form>
  );
}
