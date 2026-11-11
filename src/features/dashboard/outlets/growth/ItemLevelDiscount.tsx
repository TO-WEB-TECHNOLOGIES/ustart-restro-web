import { useTranslation } from "react-i18next";
import { ALL_LOCATIONS_ID } from "@/types/storeTypes";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { OfferMenuPageShell } from "../../components/offers/menu/OfferMenuPageShell";
import { ItemDiscountEditor } from "../../components/offers/itemDiscount/ItemDiscountEditor";

/**
 * 2026-11-11: Item Level Discount (Customer Delighters → Item discount). Product decision (user,
 * 2026-11-11): the discount is the dish's menu price discount at one outlet - saved straight away,
 * no dates, not listed in My Offers; customers see the lower price at once. "All Locations" asks for
 * one outlet because prices differ per outlet.
 */
export const ItemLevelDiscount = () => {
  const { t } = useTranslation();
  const k = "dashboard.offers.itemDiscountPage.";
  const { selectedAddressId } = useRestaurantStore();
  const restroId = !selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID ? null : selectedAddressId;

  if (restroId === null) {
    return (
      <OfferMenuPageShell title={t(`${k}title`)} subtitle={t(`${k}subtitle`)} needsOutlet>
        {() => null}
      </OfferMenuPageShell>
    );
  }
  return <ItemDiscountEditor key={restroId} restroId={restroId} title={t(`${k}title`)} subtitle={t(`${k}subtitle`)} />;
};
