import { Badge } from "@/components/ui/badge";

type PaymentStatus = "paid" | "partial" | "unpaid";

const statusConfig = {
  paid: { variant: "success" as const, label: "Paid" },
  partial: { variant: "warning" as const, label: "Partial" },
  unpaid: { variant: "destructive" as const, label: "Unpaid" },
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const { variant, label } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}
