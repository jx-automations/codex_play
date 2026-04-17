import { redirect } from "next/navigation";

// Analytics is cut from v1. Redirect to Today view.
export default function AnalyticsPage() {
  redirect("/app/today");
}
