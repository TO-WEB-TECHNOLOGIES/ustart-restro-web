import { useParams } from "react-router-dom";
import { OutletDetailView } from "../../components/OutletInfo/OutletDetailView";
import { PAGE_CLASS } from "./OutletInfo";

/** 2026-11-12: /dashboard/info/:restroId - an outlet opened from the card grid (with a back link). */
export const OutletDetailPage = () => {
  const { restroId } = useParams<{ restroId: string }>();
  return (
    <div className={PAGE_CLASS}>
      {/* 2026-11-12 (user request): full width like Orders / the header - was a centred max-w column. */}
      <div className="w-full max-w-[1600px]">
        <OutletDetailView key={restroId} restroId={restroId!} showBack />
      </div>
    </div>
  );
};
