import { useParams } from "react-router-dom";
import { usePublicQuote } from "../hooks/useQuotes";
import { Printer, MapPin, Phone, Mail, Building, FileText, CheckCircle2 } from "lucide-react";

export function QuoteViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: quote, isLoading, error } = usePublicQuote(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm font-medium text-slate-500">Loading your quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500 mb-6">
            <FileText size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Quotation Not Found</h1>
          <p className="text-slate-500">The quotation link you clicked appears to be invalid or has expired. Please contact your sales consultant for a new link.</p>
        </div>
      </div>
    );
  }

  const { enquiry, quotedBy } = quote;
  const { lead, branch } = enquiry;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return "₹0.00";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amount));
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:py-0 print:px-0">
      <div className="mx-auto max-w-4xl">
        {/* Action Bar (Hidden when printing) */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Building size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{branch.name}</h1>
              <p className="text-xs font-medium text-slate-500">Official Quotation</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-slate-900/30 active:scale-95"
          >
            <Printer size={16} />
            Download PDF
          </button>
        </div>

        {/* Quotation Document */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/50 print:rounded-none print:shadow-none">
          
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-900 p-8 text-white sm:p-12 print:bg-white print:text-slate-900 print:border-slate-300">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">QUOTATION</h2>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-400 print:text-slate-500">
                  <span>Ref: {quote.id.slice(-8).toUpperCase()}</span>
                  <span>Date: {formatDate(quote.createdAt)}</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <h3 className="text-lg font-bold">{branch.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-slate-400 print:text-slate-600">
                  <p className="flex items-center gap-2 sm:justify-end">
                    <MapPin size={14} className="print:hidden" /> 
                    {branch.address}
                  </p>
                  {branch.phone && (
                    <p className="flex items-center gap-2 sm:justify-end">
                      <Phone size={14} className="print:hidden" /> 
                      {branch.phone}
                    </p>
                  )}
                  {branch.email && (
                    <p className="flex items-center gap-2 sm:justify-end">
                      <Mail size={14} className="print:hidden" /> 
                      {branch.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Car Info */}
          <div className="grid gap-8 border-b border-slate-100 p-8 sm:grid-cols-2 sm:p-12">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Prepared For</p>
              <h4 className="text-xl font-bold text-slate-900">{lead.name}</h4>
              <div className="mt-2 space-y-1 text-sm font-medium text-slate-600">
                {lead.phone && <p>{lead.phone}</p>}
                {lead.email && <p>{lead.email}</p>}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle Details</p>
              <h4 className="text-xl font-bold text-slate-900">{enquiry.carModel}</h4>
              <p className="mt-1 text-sm font-medium text-slate-600">{quote.variant || "Standard Variant"}</p>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="p-8 sm:p-12">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="pb-4 font-bold text-slate-900">Description</th>
                  <th className="pb-4 text-right font-bold text-slate-900">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-5 font-medium">Ex-Showroom / Base Price</td>
                  <td className="py-5 text-right font-semibold text-slate-900">{formatCurrency(quote.onRoadPrice)}</td>
                </tr>
                {quote.discount && Number(quote.discount) > 0 && (
                  <tr>
                    <td className="py-5 font-medium text-emerald-600">Special Discount</td>
                    <td className="py-5 text-right font-semibold text-emerald-600">- {formatCurrency(quote.discount)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-6 text-lg font-bold text-slate-900">Final On-Road Price</td>
                  <td className="pt-6 text-right text-2xl font-black text-blue-600 print:text-slate-900">
                    {formatCurrency(quote.finalPrice)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Info */}
          <div className="bg-slate-50 p-8 sm:p-12 print:bg-white print:border-t print:border-slate-200">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Terms & Conditions</p>
                <ul className="space-y-1 text-xs font-medium text-slate-500">
                  <li>• Prices are subject to change without prior notice.</li>
                  <li>• Quotation is valid until {formatDate(quote.validUntil)}.</li>
                  <li>• Final delivery is subject to availability and payment realization.</li>
                </ul>
              </div>
              <div className="sm:text-right">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Your Sales Consultant</p>
                <p className="font-bold text-slate-900">{quotedBy.name}</p>
                <p className="text-sm font-medium text-slate-500">{quotedBy.phone || quotedBy.email || "Lotus D-CRM Team"}</p>
              </div>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Generated securely via Lotus D-CRM
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
