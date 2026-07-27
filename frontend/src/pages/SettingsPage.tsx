import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { Button } from "../components/common/Button";

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [quotationEnabled, setQuotationEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setQuotationEnabled(settings.quotationEnabled);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ quotationEnabled });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6 pb-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage system-wide configurations and features</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Feature Toggles</h2>
            
            {isLoading ? (
              <p className="text-slate-500">Loading settings...</p>
            ) : (
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">Quotation System</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enable or disable the quotation generator for the entire CRM. When disabled, the Quotation section will be hidden on all leads.
                  </p>
                </div>
                
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={quotationEnabled}
                    onChange={(e) => setQuotationEnabled(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:border-gray-600 dark:bg-slate-700 dark:peer-focus:ring-primary-800"></div>
                </label>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSave} 
                isLoading={updateSettings.isPending}
                disabled={isLoading || (settings?.quotationEnabled === quotationEnabled)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
