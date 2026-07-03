import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { cloudinaryCredentialsFormSchema } from "../../schemas/integration.schema";
import type { CloudinaryCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";

export function CloudinaryForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CloudinaryCredentialsFormValues>({ resolver: zodResolver(cloudinaryCredentialsFormSchema) });

  const onSubmit = async (values: CloudinaryCredentialsFormValues) => {
    await saveIntegration.mutateAsync({ key: "CLOUDINARY", credentials: values });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Stores car photos/videos and WhatsApp brochures uploaded via the Media Library. Find these values on your
        Cloudinary dashboard.
      </p>
      <Input label="Cloud Name" error={errors.cloudName?.message} {...register("cloudName")} />
      <Input label="API Key" error={errors.apiKey?.message} {...register("apiKey")} />
      <Input label="API Secret" type="password" error={errors.apiSecret?.message} {...register("apiSecret")} />
      <Button type="submit" isLoading={isSubmitting} className="w-fit">
        Save
      </Button>
    </form>
  );
}
