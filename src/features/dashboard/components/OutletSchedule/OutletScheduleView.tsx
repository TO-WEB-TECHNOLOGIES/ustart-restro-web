import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/utils/error";
import { useOutletLiveStatus, useOutletSchedule, useUpcomingClosures } from "../../hooks/useOutletStatus";
import { DayHoursPanel } from "./DayHoursPanel";
import { HolidaysTab } from "./HolidaysTab";
import { OutletToggle } from "./OutletToggle";
import { WeekdayCards } from "./WeekdayCards";
import { TONE_CLASSES, describeStatus } from "./outletTime";

/**
 * 2026-11-12: one outlet on the Outlet Schedule page: name, live state and switch, then two tabs -
 * Schedule (weekday cards → that day's hours and edit, with "Copy from") and Holidays (Add Holiday,
 * upcoming, history). Holidays moved off the Schedule tab 2026-11-12 (user request).
 * The parent keys it by outlet, so switching outlets starts fresh.
 */
type ScheduleTab = "schedule" | "holidays";

export const OutletScheduleView = ({ restroId }: { restroId: string }) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletSchedule.";
  const [tab, setTab] = useState<ScheduleTab>("schedule");
  // Today is selected first; the cards themselves stay in a fixed Sunday → Saturday order.
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay());
  const status = useOutletLiveStatus(restroId);
  const schedule = useOutletSchedule(restroId);
  const upcoming = useUpcomingClosures(restroId);
  const item = status.data ?? null;
  const described = item ? describeStatus(t, item.status, i18n.language) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1a2b4b] dark:text-white pb-1 truncate">
            {item?.restroName ?? t(`${k}title`)}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t(`${k}subtitle`)}</p>
        </div>
        {item && described && (
          <div className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border self-start sm:self-auto ${TONE_CLASSES[described.tone].pill}`}>
            <span className={`w-2 h-2 rounded-full ${TONE_CLASSES[described.tone].dot}`} />
            <span className={`text-sm font-bold ${TONE_CLASSES[described.tone].text}`}>{described.label}</span>
            <OutletToggle item={item} />
          </div>
        )}
      </div>

      {/* Pill tabs, same style as My Offers / Orders */}
      <Tabs value={tab} onValueChange={(value) => setTab(value as ScheduleTab)}>
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 h-auto inline-flex gap-1 rounded-full border border-slate-200 dark:border-slate-700">
          {(["schedule", "holidays"] as const).map((id) => (
            <TabsTrigger
              key={id}
              value={id}
              className="rounded-full px-6 py-2.5 font-bold text-sm transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
            >
              {t(`${k}tabs.${id}`)}
              {id === "holidays" && (upcoming.data?.length ?? 0) > 0 && (
                <span className="ml-2 text-xs opacity-70">{upcoming.data!.length}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "holidays" ? (
        <HolidaysTab restroId={restroId} />
      ) : schedule.isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-secondary-orange animate-spin" /></div>
      ) : schedule.isError ? (
        <div className="py-12 flex flex-col items-center gap-4 text-center">
          <p className="text-sm font-medium text-red-500">{getErrorMessage(schedule.error, t(`${k}hours.loadFailed`))}</p>
          <button
            type="button"
            onClick={() => schedule.refetch()}
            className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t(`${k}retry`)}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <WeekdayCards days={schedule.data ?? null} selected={selectedDay} onSelect={setSelectedDay} />
          <DayHoursPanel
            key={selectedDay}
            restroId={restroId}
            dayOfWeek={selectedDay}
            day={schedule.data?.find((d) => d.dayOfWeek === selectedDay) ?? null}
            days={schedule.data ?? []}
            hasSchedule={!!schedule.data}
            isSetupLocked={item?.isSetupLocked ?? false}
          />
        </div>
      )}
    </div>
  );
};
