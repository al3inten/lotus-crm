import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { livekitCredentialsFormSchema } from "../../schemas/integration.schema";
import type { LivekitCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";

export function LiveKitForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LivekitCredentialsFormValues>({ resolver: zodResolver(livekitCredentialsFormSchema) });

  const onSubmit = (values: LivekitCredentialsFormValues) => {
    saveIntegration.mutate({ key: "LIVEKIT", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Point this at your self-hosted LiveKit server. The voice-worker process uses this to create rooms and dial
        out via the TeleCMI SIP trunk.
      </p>
      <Input label="Server URL" placeholder="wss://your-livekit-host" error={errors.serverUrl?.message} {...register("serverUrl")} />
      <Input label="API Key" error={errors.apiKey?.message} {...register("apiKey")} />
      <Input label="API Secret" type="password" error={errors.apiSecret?.message} {...register("apiSecret")} />
      {saveIntegration.isError && (
        <p className="text-sm text-red-600">Failed to save — check the values and try again.</p>
      )}
      <Button type="submit" isLoading={saveIntegration.isPending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
