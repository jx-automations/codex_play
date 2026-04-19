"use client";

import { useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useSettings } from "@/hooks/useSettings";

export function SettingsPanel() {
  const { user, signOutUser } = useAuth();
  const { settings, loading, save } = useSettings();

  const [dailyGoal, setDailyGoal]     = useState<string>("");
  const [followUpDays, setFollowUpDays] = useState<string>("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  // Seed local inputs once settings load
  const goalVal     = dailyGoal     !== "" ? dailyGoal     : String(settings.dailyGoal);
  const followUpVal = followUpDays  !== "" ? followUpDays  : String(settings.followUpIntervalDays);

  async function handleSave() {
    const goal = parseInt(goalVal, 10);
    const days = parseInt(followUpVal, 10);
    if (isNaN(goal) || goal < 1) return;
    if (isNaN(days) || days < 1) return;

    setSaving(true);
    try {
      await save({ dailyGoal: goal, followUpIntervalDays: days });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2].map((n) => <div key={n} className="h-20 animate-pulse rounded-xl bg-neutral-100" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-2 space-y-6">
      {/* Profile */}
      <section className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Account</p>
        <div className="flex items-center gap-3 py-2">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full" width={40} height={40} />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
              {user?.displayName?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="font-medium text-neutral-900">{user?.displayName ?? "—"}</p>
            <p className="text-xs text-neutral-500">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOutUser()}
          className="mt-2 w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Sign out
        </button>
      </section>

      {/* Goals */}
      <section className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Daily targets</p>

        <div className="mb-4">
          <label htmlFor="daily-goal" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Daily DM goal
          </label>
          <input
            id="daily-goal"
            type="number"
            min={1}
            max={200}
            value={goalVal}
            onChange={(e) => setDailyGoal(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-neutral-400">How many DMs you aim to send each day</p>
        </div>

        <div className="mb-4">
          <label htmlFor="followup-days" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Default follow-up interval (days)
          </label>
          <input
            id="followup-days"
            type="number"
            min={1}
            max={30}
            value={followUpVal}
            onChange={(e) => setFollowUpDays(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-neutral-400">Next follow-up auto-set to this many days after adding a prospect</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
            saved ? "bg-success text-white" : "bg-primary text-white hover:bg-indigo-600 disabled:opacity-60"
          }`}
        >
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save settings"}
        </button>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Notifications</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-700">Follow-up reminders</p>
            <p className="text-xs text-neutral-400">Notify when prospects are overdue</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={settings.notifications.followUpReminders}
            onChange={async (e) =>
              save({ notifications: { ...settings.notifications, followUpReminders: e.target.checked } })
            }
            className="h-4 w-4 accent-primary"
          />
        </div>
      </section>

      {/* App info */}
      <p className="text-center text-xs text-neutral-300">OutreachFlow · Built for solo SMMA operators</p>
    </div>
  );
}
