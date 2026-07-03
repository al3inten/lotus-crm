import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "../common/Input";
import { Button } from "../common/Button";
import { googleSheetsCredentialsFormSchema } from "../../schemas/integration.schema";
import type { GoogleSheetsCredentialsFormValues } from "../../schemas/integration.schema";
import { useSaveIntegration } from "../../hooks/useIntegrations";

export function GoogleSheetsForm({ onSaved }: { onSaved: () => void }) {
  const saveIntegration = useSaveIntegration();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoogleSheetsCredentialsFormValues>({ resolver: zodResolver(googleSheetsCredentialsFormSchema) });

  const onSubmit = (values: GoogleSheetsCredentialsFormValues) => {
    saveIntegration.mutate({ key: "GOOGLE_SHEETS", credentials: values }, { onSuccess: onSaved });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
        Create a Google Cloud service account, enable the Sheets API, and share your spreadsheet with the service
        account's email (found in the JSON as <code>client_email</code>) as a Viewer. Paste the full downloaded JSON
        key below.
      </p>
      <Textarea
        label="Service Account JSON"
        rows={8}
        error={errors.serviceAccountJson?.message}
        {...register("serviceAccountJson")}
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
