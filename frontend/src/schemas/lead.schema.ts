import { z } from "zod";
import { ENQUIRY_TYPES, LEAD_SOURCES } from "../types";

export const walkInLeadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  carModel: z.string().min(1, "Car model is required"),
  enquiryType: z.enum(ENQUIRY_TYPES),
  location: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  assignedCrId: z.string().optional(),
});

export type WalkInLeadFormValues = z.infer<typeof walkInLeadFormSchema>;

export const manualEnquiryFormSchema = walkInLeadFormSchema.extend({
  source: z.enum(LEAD_SOURCES),
});

export type ManualEnquiryFormValues = z.infer<typeof manualEnquiryFormSchema>;
