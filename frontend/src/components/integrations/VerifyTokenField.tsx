import { RefreshCw } from "lucide-react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { generateVerifyToken } from "./webhookUrl";

/** "Webhook Verify Token" input with a Generate button — the token is just an arbitrary
 * shared string (see generateVerifyToken), so there's no reason to make the CR invent one
 * by hand instead of clicking to fill it in. */
export function VerifyTokenField({
  value,
  error,
  onChange,
  inputProps,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  /** Spread onto the underlying <input> — pass react-hook-form's register() output here. */
  inputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          label="Webhook Verify Token"
          error={error}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...inputProps}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="md"
        icon={<RefreshCw size={14} />}
        onClick={() => onChange(generateVerifyToken())}
      >
        Generate
      </Button>
    </div>
  );
}
