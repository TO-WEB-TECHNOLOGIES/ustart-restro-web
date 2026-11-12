import { useTranslation } from "react-i18next";
import type { RestaurantStatus } from "../../api/outletInfoApi";
import { STATUS_CHIP } from "./outletInfoFormat";

/** 2026-11-12: an outlet's approval status (ACTIVE, Update approval pending, ...), en/hi labels. */
export const StatusChip = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const tone = STATUS_CHIP[status as RestaurantStatus] ?? STATUS_CHIP.ON_HOLD;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${tone}`}>
      {t(`dashboard.outletInfo.status.${status}`, { defaultValue: status })}
    </span>
  );
};
