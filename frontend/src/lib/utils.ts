export function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    signDisplay: "always",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "competitive":
      return "bg-green-100 text-green-800";
    case "at_risk":
      return "bg-yellow-100 text-yellow-800";
    case "margin_leakage":
      return "bg-red-100 text-red-800";
    case "underpriced":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
