import { useParams } from "react-router-dom";
import { OutletDetailView } from "../../components/OutletInfo/OutletDetailView";
import { PAGE_CLASS } from "./OutletInfo";

/** 2026-11-12: /dashboard/info/:restroId - an outlet opened from the card grid (with a back link). */
export const OutletDetailPage = () => {
  const { restroId } = useParams<{ restroId: string }>();
  return (
    <div className={PAGE_CLASS}>
      <div className="max-w-6xl mx-auto">
        <OutletDetailView key={restroId} restroId={restroId!} showBack />
      </div>
    </div>
  );
};
