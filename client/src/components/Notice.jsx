/* Style: بطاقات التنبيه تستخدم خطاً جانبياً واضحاً وتبقي اللون الأحمر محصوراً في حالة الخطر. */
import { AlertTriangle, Check, Info } from "lucide-react";

export default function Notice({ kind = "info", title, children }) {
  const Icon = kind === "danger" ? AlertTriangle : kind === "success" ? Check : Info;
  return (
    <div className={`notice notice-${kind}`} role={kind === "danger" ? "alert" : "status"}>
      <span className="notice-icon"><Icon size={18} strokeWidth={2.2} /></span>
      <div>
        <strong>{title}</strong>
        <div className="notice-copy">{children}</div>
      </div>
    </div>
  );
}
