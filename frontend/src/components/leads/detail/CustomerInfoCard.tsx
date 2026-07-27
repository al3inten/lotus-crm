import { UserCircle2, Phone, Mail, MapPin, Car, Tag, Briefcase } from "lucide-react";
import { Card, CardHeader } from "../../../components/common/Card";
import { InfoField } from "./InfoField";
import { CopyButton } from "../../../components/common/CopyButton";
import type { LeadWithHistory, Enquiry } from "../../../types";

export function CustomerInfoCard({ lead, enquiry }: { lead: LeadWithHistory; enquiry: Enquiry }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        icon={<UserCircle2 size={18} />}
        iconClassName="bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
        title="Customer Information"
        subtitle="Who you're speaking with"
      />
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <InfoField
          icon={<Phone size={13} />}
          label="Mobile Number"
          value={
            <span className="inline-flex items-center gap-1.5">
              {lead.phoneRaw}
              <CopyButton value={lead.phoneRaw} label="Copy phone number" />
            </span>
          }
        />
        <InfoField
          icon={<Mail size={13} />}
          label="Email"
          value={
            <span className="inline-flex items-center gap-1.5">
              {lead.email || "—"}
              {lead.email && <CopyButton value={lead.email} label="Copy email" />}
            </span>
          }
        />
        <InfoField
          icon={<MapPin size={13} />}
          label="Address"
          className="sm:col-span-2"
          value={lead.address ? `${lead.address}${lead.pincode ? `, ${lead.pincode}` : ""}` : "—"}
        />
        <InfoField icon={<Car size={13} />} label="Interested Vehicle" value={enquiry.carModel} />
        <InfoField icon={<Tag size={13} />} label="Customer Category" value={enquiry.enquiryCategory || "—"} />
        <InfoField icon={<Briefcase size={13} />} label="Profession" value={lead.profession || "—"} />
      </div>
    </Card>
  );
}
