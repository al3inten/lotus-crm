import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { geminiCredentialsFormSchema } from "../../schemas/integration.schema";
import type { GeminiCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";

export function GeminiForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeminiCredentialsFormValues>({ resolver: zodResolver(geminiCredentialsFormSchema) });

  const onSubmit = (values: GeminiCredentialsFormValues) => {
    saveIntegration.mutate({ key: "GEMINI", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Powers the voice agent (Live API) and the WhatsApp/Instagram chatbot replies.
      </p>
      <Input label="Gemini API Key" type="password" error={errors.apiKey?.message} {...register("apiKey")} />
      {saveIntegration.isError && (
        <p className="text-sm text-red-600">Failed to save — check the values and try again.</p>
      )}
      <Button type="submit" isLoading={saveIntegration.isPending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
