import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { metaAdsCredentialsFormSchema } from "../../schemas/integration.schema";
import type { MetaAdsCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";
import { getMetaWebhookUrl } from "./webhookUrl";

export function MetaAdsForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MetaAdsCredentialsFormValues>({ resolver: zodResolver(metaAdsCredentialsFormSchema) });

  const onSubmit = async (values: MetaAdsCredentialsFormValues) => {
    await saveIntegration.mutateAsync({ key: "META_ADS", credentials: values });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        In your Meta App's Webhooks settings, subscribe the Page to <strong>leadgen</strong> and set the callback URL
        to <code className="break-all">{getMetaWebhookUrl()}</code>, using the same Verify Token you enter below.
      </p>
      <Input label="Page ID" error={errors.pageId?.message} {...register("pageId")} />
      <Input label="Page Access Token" type="password" error={errors.pageAccessToken?.message} {...register("pageAccessToken")} />
      <Input label="App Secret" type="password" error={errors.appSecret?.message} {...register("appSecret")} />
      <Input label="Webhook Verify Token" error={errors.verifyToken?.message} {...register("verifyToken")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save
      </Button>
    </form>
  );
}
