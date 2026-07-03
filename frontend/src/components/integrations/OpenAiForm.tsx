import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { openaiCredentialsFormSchema } from "../../schemas/integration.schema";
import type { OpenAiCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";

export function OpenAiForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpenAiCredentialsFormValues>({ resolver: zodResolver(openaiCredentialsFormSchema) });

  const onSubmit = (values: OpenAiCredentialsFormValues) => {
    saveIntegration.mutate({ key: "OPENAI", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Used only to help draft AI agent system prompts in the AI Agents page — not used at runtime by the voice
        agent or chatbots (those run on Gemini).
      </p>
      <Input label="OpenAI API Key" type="password" error={errors.apiKey?.message} {...register("apiKey")} />
      {saveIntegration.isError && (
        <p className="text-sm text-red-600">Failed to save — check the values and try again.</p>
      )}
      <Button type="submit" isLoading={saveIntegration.isPending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
