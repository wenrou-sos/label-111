export function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(2) + "亿";
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + "万";
  }
  return value.toFixed(2);
}

export function formatNumber(value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(2) + "亿";
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + "万";
  }
  return value.toLocaleString("zh-CN");
}

export function formatCompact(value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(1) + "亿";
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + "万";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }
  return value.toString();
}

export function formatPercent(value: number): string {
  return value.toFixed(2) + "%";
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
