import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Tag,
  Image as ImageIcon,
  Pencil,
  Ban,
  Trash2,
  Percent,
  IndianRupee,
  Dot,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { type MenuItem, type FoodType } from "../../../../types/menuTypes";
import { useMenu } from "../../hooks/useMenu";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { ALL_LOCATIONS_ID } from "../../../../types/storeTypes";
import { Switch } from "../../../../components/ui/switch";
import { Modal } from "../../../../components/ui/modal";
import { DeleteItemModal } from "./DeleteItemModal";
import { BlockItemModal } from "./BlockItemModal";
import { AddEditItemModal } from "./AddEditItemModal";

interface MenuItemCardProps {
  /** The menu item data to display */
  item: MenuItem;
}

/**
 * Marker component to display symbols for Veg, Non-Veg, and Egg items.
 */
const FoodTypeMarker = ({ type }: { type: FoodType }) => {
  const config = {
    VEG: { color: "border-green-600", dot: "bg-green-600" },
    NON_VEG: { color: "border-red-600", dot: "bg-red-600" },
    CONTAINS_EGG: { color: "border-yellow-500", dot: "bg-yellow-500" },
  };

  const target = config[type];

  return (
    <div
      className={`w-4 h-4 border-2 ${target.color} flex items-center justify-center rounded-sm p-[1px]`}
    >
      <div className={`w-full h-full ${target.dot} rounded-full`} />
    </div>
  );
};

/**
 * Individual card component for a menu item.
 * Displays item image, dietary preference marker, name, price breakdown, and status tags.
 * Uses framer-motion's layoutId for smooth layout transitions.
 */
export const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { updateMenuItem, updatedItems, selectedCategoryId, deleteMenuItem } =
    useMenu();
  const { selectedAddressId } = useRestaurantStore();

  const activeTab = location.pathname.split("/").pop() || "edit";
  const [isEditing, setIsEditing] = useState(false);
  const [isStockConfirmOpen, setStockConfirmOpen] = useState(false);
  const [pendingStockValue, setPendingStockValue] = useState<boolean>(false);

  // Delete and Block Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Reset editing state when tab changes
  useEffect(() => {
    if (isEditing) {
      setIsEditing(false);
    }
  }, [activeTab]);

  // Calculate Stock Stats
  const stockStates = Object.values(item.inStock || {});
  const inStockCount = stockStates.filter((s) => s).length;
  const outStockCount = stockStates.filter((s) => !s).length;

  // Determine current display status
  const isAggregated =
    !selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID;
  const isCurrentLocationInStock =
    selectedAddressId && !isAggregated
      ? (item.inStock[selectedAddressId] ?? false)
      : false;

  /**
   * Toggles the food type of the item for testing purposes.
   */
  const handleToggleType = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCategoryId === null) return;
    const types: FoodType[] = ["VEG", "CONTAINS_EGG", "NON_VEG"];
    const currentIndex = types.indexOf(item.foodType);
    const nextType = types[(currentIndex + 1) % types.length];
    updateMenuItem(
      selectedCategoryId,
      item.id,
      { foodType: nextType },
      selectedAddressId,
    );
  };

  /**
   * Generic field updater
   */
  const handleUpdateField = (
    field: keyof MenuItem,
    value: MenuItem[keyof MenuItem],
  ) => {
    if (selectedCategoryId === null) return;
    updateMenuItem(
      selectedCategoryId,
      item.id,
      { [field]: value },
      selectedAddressId,
    );
  };

  /**
   * Specific updater for stock to handle the Record structure
   */
  const handleStockUpdate = (checked: boolean) => {
    if (selectedCategoryId === null) return;

    if (isAggregated) {
      setPendingStockValue(checked);
      setStockConfirmOpen(true);
      return;
    }

    const newInStock = { ...item.inStock, [selectedAddressId!]: checked };
    updateMenuItem(
      selectedCategoryId,
      item.id,
      { inStock: newInStock },
      selectedAddressId,
    );
  };

  const handleConfirmStockUpdate = () => {
    if (selectedCategoryId === null) return;

    const newInStock = { ...item.inStock };
    Object.keys(newInStock).forEach((key) => {
      newInStock[key] = pendingStockValue;
    });

    updateMenuItem(selectedCategoryId, item.id, { inStock: newInStock }, null);
    setStockConfirmOpen(false);
  };

  const handleDeleteItem = async () => {
    if (selectedCategoryId === null) return;
    await deleteMenuItem(selectedCategoryId, item.id);
  };

  const handleBlockItem = () => {
    if (selectedCategoryId === null) return;
    const nextStatus = item.status === "blocked" ? "active" : "blocked";
    updateMenuItem(
      selectedCategoryId,
      item.id,
      { status: nextStatus },
      selectedAddressId,
    );
  };

  const selectedCategoryName = useMenu().selectedCategory?.name || "";

  // Calculate final price (simplified for display)
  const discountValue = item.discountIsAbsolute
    ? item.discountAmount
    : (item.itemPrice * item.discountAmount) / 100;
  const finalPrice = item.itemPrice - discountValue;

  // Local changes for this item
  const isLocalDeleted = item.isDeleted === true;
  const isLocalBlocked = item.status === "blocked";

  return (
    <motion.div
      layoutId={String(item.id.toString())}
      className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col lg:flex-row gap-4 group relative ${isLocalDeleted ? "opacity-50 grayscale" : ""}`}
    >
      {/* Left Section: Image and Primary Details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
        {/* Item Image with Discount Badge */}
        <div className="w-full sm:w-24 h-48 sm:h-24 rounded-2xl overflow-hidden relative shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 p-2 text-center">
              <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <span className="text-[10px] sm:text-[8px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 leading-tight">
                {t("dashboard.menuEditor.noImageShort")}
              </span>
            </div>
          )}
          {item.hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-500 text-white p-1.5 rounded-lg shadow-lg sm:p-1 sm:top-2 sm:left-2">
              <Tag className="w-4 h-4 fill-white" />
            </div>
          )}
        </div>

        {/* Item Details: Name, Prices, and tags */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <div
                onClick={handleToggleType}
                className="cursor-pointer shrink-0"
                title="Click to cycle food type"
              >
                <FoodTypeMarker type={item.foodType} />
              </div>
              <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                {item.name}
              </h4>
            </div>

            {/* Contextual Header Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Status Badges */}
              {isLocalDeleted && (
                <div className="flex items-center px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider gap-0.5 border border-red-100 dark:border-red-900/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t("dashboard.menuEditor.markedForDeletion")}</span>
                </div>
              )}

              {isLocalBlocked && (
                <div className="flex items-center px-2 py-1 bg-slate-900 text-white dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-wider gap-0.5">
                  <Ban className="w-3 h-3" />
                  <span>{t("dashboard.menuEditor.blocked")}</span>
                </div>
              )}

              {updatedItems[item.id] && !isLocalDeleted && !isLocalBlocked && (
                <div className="flex items-center px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider gap-0.5">
                  <Dot className="w-4 h-4" />
                  <span>{t("dashboard.menuEditor.edited")}</span>
                </div>
              )}

              {activeTab === "edit" && (
                <div className="flex items-center gap-2">
                  {isAggregated ? (
                    <div className="flex gap-1">
                      {inStockCount > 0 && (
                        <div className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600 dark:bg-green-900/20">
                          {inStockCount}{" "}
                          {t("dashboard.menuEditor.inStockBadge")}
                        </div>
                      )}
                      {outStockCount > 0 && (
                        <div className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 dark:bg-red-900/20">
                          {outStockCount}{" "}
                          {t("dashboard.menuEditor.outStockBadge")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isCurrentLocationInStock ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"}`}
                    >
                      {isCurrentLocationInStock
                        ? t("dashboard.menuEditor.inStock")
                        : t("dashboard.menuEditor.outOfStock")}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsDetailsModalOpen(true)}
                      className="p-2 bg-blue-50 dark:bg-blue-900/20 text-[var(--color-primary-blue)] dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        isLocalBlocked
                          ? handleBlockItem()
                          : setIsBlockModalOpen(true)
                      }
                      title={
                        isLocalBlocked
                          ? t("dashboard.menuEditor.unblockItem")
                          : t("dashboard.menuEditor.blockItem")
                      }
                      className={`p-2 rounded-xl transition-colors ${isLocalBlocked ? "bg-slate-900 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100"}`}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        isLocalDeleted
                          ? handleUpdateField("isDeleted", false)
                          : setIsDeleteModalOpen(true)
                      }
                      title={
                        isLocalDeleted
                          ? t("common.restore")
                          : t("dashboard.menuEditor.deleteItem")
                      }
                      className={`p-2 rounded-xl transition-colors ${isLocalDeleted ? "bg-orange-500 text-white" : "bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100"}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "stock" && (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  {isAggregated ? (
                    <>
                      <div className="flex items-center gap-2 min-w-[120px] justify-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {t("dashboard.menuEditor.inStockOverview")}
                        </span>
                        {inStockCount > 0 && (
                          <span className="text-xs font-bold text-green-500">
                            {inStockCount}{" "}
                            {t("dashboard.menuEditor.inStockShort")}
                          </span>
                        )}
                        {inStockCount > 0 && outStockCount > 0 && (
                          <span className="text-slate-300">|</span>
                        )}
                        {outStockCount > 0 && (
                          <span className="text-xs font-bold text-red-500">
                            {outStockCount}{" "}
                            {t("dashboard.menuEditor.outStockShort")}
                          </span>
                        )}
                      </div>
                      <Switch
                        checked={outStockCount === 0 && inStockCount > 0}
                        onCheckedChange={handleStockUpdate}
                        className="data-[state=checked]:bg-[#539987]"
                      />
                    </>
                  ) : (
                    <>
                      <span
                        className={`hidden md:inline text-[10px] font-black uppercase tracking-widest ${isCurrentLocationInStock ? "text-green-500" : "text-red-500"}`}
                      >
                        {isCurrentLocationInStock
                          ? t("dashboard.menuEditor.inStock")
                          : t("dashboard.menuEditor.outOfStock")}
                      </span>
                      <Switch
                        checked={isCurrentLocationInStock}
                        onCheckedChange={handleStockUpdate}
                        className="data-[state=checked]:bg-[#539987]"
                      />
                    </>
                  )}
                </div>
              )}

              {activeTab === "taxes" && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {t("dashboard.menuEditor.taxLabel")}
                    </span>
                    <input
                      type="number"
                      value={item.taxAmount}
                      onChange={(e) =>
                        handleUpdateField("taxAmount", Number(e.target.value))
                      }
                      className="w-8 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                    />
                    <span className="text-sm font-bold text-slate-400">%</span>
                  </div>
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      ₹{finalPrice} + {item.taxAmount}%{" "}
                      {t("dashboard.menuEditor.taxLabel")}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      = ₹
                      {(
                        finalPrice +
                        (finalPrice * item.taxAmount) / 100
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p
            className={`text-xs mb-1 line-clamp-1 ${item.description ? "text-slate-500 dark:text-slate-400" : "text-orange-500 font-medium italic"}`}
          >
            {item.description || t("dashboard.menuEditor.noDescription")}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-base font-black text-slate-900 dark:text-white">
              ₹{finalPrice}
            </span>
            {item.discountAmount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 line-through font-bold">
                  ₹{item.itemPrice}
                </span>
                <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-md">
                  {item.discountIsAbsolute
                    ? `₹${item.discountAmount} ${t("dashboard.menuEditor.offLabel")}`
                    : `${item.discountAmount}% ${t("dashboard.menuEditor.offLabel")}`}
                </span>
              </div>
            )}
            {activeTab === "edit" && item.isCustomisable && (
              <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded">
                {t("dashboard.menuEditor.customisable")}
              </span>
            )}
          </div>

          {/* Breakdown Summary */}
          {activeTab === "charges" && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {t("dashboard.recentOrders.table.items")}: ₹{item.itemPrice} (
                {t("dashboard.menuEditor.basePrice")})
                {item.discountAmount > 0 &&
                  ` - ${item.discountIsAbsolute ? "₹" : ""}${item.discountAmount}${item.discountIsAbsolute ? "" : "%"} (${t("dashboard.menuEditor.discountShort")})`}
                {item.packagingCharges > 0 &&
                  ` + ₹${item.packagingCharges} (${t("dashboard.menuEditor.packagingShort")})`}
                {` = ₹${(finalPrice + item.packagingCharges).toFixed(2)}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isStockConfirmOpen}
        onClose={() => setStockConfirmOpen(false)}
        title={t("dashboard.menuEditor.stockUpdate.confirmTitle")}
      >
        <div className="flex flex-col gap-6">
          <p className="text-slate-600 dark:text-slate-300">
            {t("dashboard.menuEditor.stockUpdate.confirmDesc")}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setStockConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t("dashboard.menuEditor.stockUpdate.cancelAction")}
            </button>
            <button
              onClick={handleConfirmStockUpdate}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[var(--color-primary-blue)] hover:opacity-90 transition-opacity"
            >
              {t("dashboard.menuEditor.stockUpdate.confirmAction")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Right Section: Charges Panel */}
      {activeTab === "charges" && (
        <div className="w-full lg:w-64 flex flex-col lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-4 shrink-0 lg:justify-center">
          {!isEditing ? (
            <div className="flex items-center justify-between lg:justify-center lg:flex-col lg:gap-1">
              <div className="flex flex-col lg:items-center">
                <span className="text-[10px] font-black text-[var(--color-primary-blue)] dark:text-[#539987] uppercase tracking-widest leading-none">
                  {t("dashboard.menuEditor.netPrice")}
                </span>
                <span className="text-xl font-black text-[var(--color-primary-blue)] dark:text-[#539987]">
                  ₹{(finalPrice + item.packagingCharges).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-[var(--color-primary-blue)] transition-colors rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {/* 1. Original Price Row */}
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {t("dashboard.menuEditor.originalPrice")}
                </label>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <input
                    type="number"
                    value={item.itemPrice}
                    onChange={(e) =>
                      handleUpdateField("itemPrice", Number(e.target.value))
                    }
                    className="w-14 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                  />
                </div>
              </div>

              {/* 2. Discount Row */}
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {t("dashboard.menuEditor.discountLabel")}
                </label>
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      onClick={() =>
                        handleUpdateField("discountIsAbsolute", true)
                      }
                      className={`p-1 rounded ${item.discountIsAbsolute ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
                    >
                      <IndianRupee className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateField("discountIsAbsolute", false)
                      }
                      className={`p-1 rounded ${!item.discountIsAbsolute ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
                    >
                      <Percent className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <input
                      type="number"
                      value={item.discountAmount}
                      onChange={(e) =>
                        handleUpdateField(
                          "discountAmount",
                          Number(e.target.value),
                        )
                      }
                      className="w-14 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Packaging Row */}
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {t("dashboard.menuEditor.packaging")}
                </label>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <input
                    type="number"
                    value={item.packagingCharges}
                    onChange={(e) =>
                      handleUpdateField(
                        "packagingCharges",
                        Number(e.target.value),
                      )
                    }
                    className="w-14 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                  />
                </div>
              </div>

              {/* 4. Footer: Live Total & Close Button */}
              <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-[var(--color-primary-blue)] dark:text-[#539987] uppercase tracking-widest leading-none">
                    {t("dashboard.orders.card.totalAmount")}
                  </span>
                  <span className="text-xs font-black text-[var(--color-primary-blue)] dark:text-[#539987]">
                    ₹{(finalPrice + item.packagingCharges).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="py-1.5 px-3 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                >
                  {t("dashboard.menuEditor.close")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modals */}
      <DeleteItemModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteItem}
        item={item}
      />
      <BlockItemModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleBlockItem}
        item={item}
      />
      <AddEditItemModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        item={item}
        categoryName={selectedCategoryName}
        categoryId={selectedCategoryId || 0}
      />
    </motion.div>
  );
};
