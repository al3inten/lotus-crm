import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw, LogOut, Pencil } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { CopyableField } from "../common/CopyableField";
import { metaAppCredentialsFormSchema } from "../../schemas/integration.schema";
import type { MetaAppCredentialsFormValues } from "../../schemas/integration.schema";
import {
  useMetaAppConfig,
  useMetaAdsStatus,
  useStartMetaOAuth,
  useDisconnectMetaAds,
  useSyncMetaAdsPage,
  useSyncAllMetaAdsPages,
  useSaveIntegration,
} from "../../hooks/useIntegrations";
import { getMetaWebhookUrl } from "./webhookUrl";

function MetaAppConfigSection() {
  const { data: appConfig, isLoading } = useMetaAppConfig();
  const saveIntegration = useSaveIntegration();
  const [editing, setEditing] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MetaAppCredentialsFormValues>({ resolver: zodResolver(metaAppCredentialsFormSchema) });

  const onSubmit = (values: MetaAppCredentialsFormValues) => {
    saveIntegration.mutate({ key: "META_APP", credentials: values }, { onSuccess: () => setEditing(false) });
  };

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-lg bg-gray-100" />;
  }

  const showForm = editing || !appConfig?.configured;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800">Meta App Settings</span>
        {appConfig?.configured && !editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={13} /> Edit
          </Button>
        )}
      </div>

      {appConfig?.redirectUri && (
        <div className="flex flex-col gap-2">
          <CopyableField label="Redirect URI — add this under Facebook Login → Settings in your Meta App" value={appConfig.redirectUri} />
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
            From your Meta Developer App's dashboard (Settings → Basic). Register the Redirect URI above under
            Facebook Login → Settings → Valid OAuth Redirect URIs before connecting.
          </p>
          <Input
            label="App ID"
            defaultValue={appConfig?.appId ?? ""}
            error={errors.appId?.message}
            {...register("appId")}
          />
          <Input label="App Secret" type="password" placeholder="••••••••" error={errors.appSecret?.message} {...register("appSecret")} />
          {saveIntegration.isError && (
            <p className="text-sm text-red-600">Failed to save — check the values and try again.</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" isLoading={saveIntegration.isPending} className="w-fit">
              Save
            </Button>
            {appConfig?.configured && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      ) : (
        <p className="text-xs text-gray-500">App ID {appConfig?.appId}</p>
      )}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
    </svg>
  );
}

export function MetaAdsForm({ onSaved: _onSaved }: { onSaved: () => void }) {
  const { data: status, isLoading } = useMetaAdsStatus();
  const { data: appConfig } = useMetaAppConfig();
  const startOAuth = useStartMetaOAuth();
  const disconnect = useDisconnectMetaAds();
  const syncPage = useSyncMetaAdsPage();
  const syncAll = useSyncAllMetaAdsPages();
  const [message, setMessage] = useState<string | null>(null);
  const [syncingPageId, setSyncingPageId] = useState<string | null>(null);

  const handleLogin = async () => {
    const { url } = await startOAuth.mutateAsync();
    window.location.href = url;
  };

  const handleDisconnect = () => {
    if (!window.confirm("Disconnect Meta Ads? This removes the saved Facebook login and every connected Page.")) return;
    setMessage(null);
    disconnect.mutate();
  };

  const handleSyncPage = async (pageId: string) => {
    setSyncingPageId(pageId);
    setMessage(null);
    try {
      const result = await syncPage.mutateAsync(pageId);
      setMessage(`Synced — ${result.created} new lead(s) imported.`);
    } finally {
      setSyncingPageId(null);
    }
  };

  const handleSyncAll = async () => {
    setMessage(null);
    const result = await syncAll.mutateAsync();
    setMessage(`Synced all Pages — ${result.created} new lead(s) imported.`);
  };

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-lg bg-gray-100" />;
  }

  if (!status?.connected) {
    return (
      <div className="flex flex-col gap-3">
        <MetaAppConfigSection />
        <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
          Log in with the Facebook account that manages your Pages — we'll list them and turn on lead-form
          delivery automatically.
        </p>
        <Button onClick={handleLogin} isLoading={startOAuth.isPending} disabled={!appConfig?.configured} className="w-fit">
          <FacebookIcon /> Login with Facebook
        </Button>
        {!appConfig?.configured && (
          <p className="text-xs text-gray-500">Save the App ID and App Secret above before connecting.</p>
        )}
        {startOAuth.isError && <p className="text-sm text-red-600">Couldn't start Facebook login — try again.</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <MetaAppConfigSection />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <span>Connected · {status.fbUserName}</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleLogin} isLoading={startOAuth.isPending}>
            <RefreshCw size={13} /> Re-authorize
          </Button>
          <Button variant="danger" size="sm" onClick={handleDisconnect} isLoading={disconnect.isPending}>
            <LogOut size={13} /> Disconnect
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">Your Pages & Lead Forms</span>
          <Button variant="secondary" size="sm" onClick={handleSyncAll} isLoading={syncAll.isPending}>
            <RefreshCw size={13} /> Sync all leads
          </Button>
        </div>

        {status.pages.length === 0 ? (
          <p className="text-sm text-gray-500">No Pages found for this Facebook login.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
            {status.pages.map((page) => (
              <div key={page.pageId} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{page.pageName}</p>
                  <p className="text-xs text-gray-500">
                    {page.leadFormCount} form(s) · {page.webhookSubscribed ? "webhook subscribed" : "webhook pending"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSyncPage(page.pageId)}
                  isLoading={syncingPageId === page.pageId}
                >
                  Sync
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && <p className="text-sm font-medium text-gray-700">{message}</p>}

      <CopyableField label="Realtime webhook" value={getMetaWebhookUrl()} />
    </div>
  );
}
