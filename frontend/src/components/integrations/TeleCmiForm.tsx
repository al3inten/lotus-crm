import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { telecmiCredentialsFormSchema } from "../../schemas/integration.schema";
import type { TelecmiCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";

export function TeleCmiForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TelecmiCredentialsFormValues>({ resolver: zodResolver(telecmiCredentialsFormSchema) });

  const onSubmit = async (values: TelecmiCredentialsFormValues) => {
    await saveIntegration.mutateAsync({ key: "TELECMI", credentials: values });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Configure your TeleCMI SIP trunk here — it's used to create an outbound SIP trunk in LiveKit so the voice
        agent can dial leads. There's no live verification for SIP credentials; connectivity is confirmed on the
        first outbound call.
      </p>
      <Input label="SIP Trunk URI / IP" error={errors.sipUri?.message} {...register("sipUri")} />
      <Input label="Trunk Username" error={errors.trunkUsername?.message} {...register("trunkUsername")} />
      <Input label="Trunk Password" type="password" error={errors.trunkPassword?.message} {...register("trunkPassword")} />
      <Input label="Caller ID Number" placeholder="+91XXXXXXXXXX" error={errors.callerIdNumber?.message} {...register("callerIdNumber")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save
      </Button>
    </form>
  );
}
