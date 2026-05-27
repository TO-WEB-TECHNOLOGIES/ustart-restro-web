import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Search,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMenu } from "../../hooks/useMenu";
import { useMenuData } from "../../hooks/useMenuData";
import { AddCategoryModal } from "./AddCategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";
import { DisableCategoryModal } from "./DisableCategoryModal";
import { type Category } from "../../../../types/menuTypes";

interface CategorySidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  hideScore?: boolean;
}

/**
 * Sidebar component for the Menu Editor.
 * Displays a list of all menu categories and allows the user to select one.
 */
export const CategorySidebar = ({
  onClose,
  isCollapsed,
  hideScore = false,
}: CategorySidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categories, selectedCategoryId, setSelectedCategoryId } = useMenu();
  const { score, status } = useMenuData();
  const [categorySearch, setCategorySearch] = useState("");

  // Track which categories are manually expanded (by their IDs)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(),
  );

  // Track which category's menu is currently open (null if none)
  const [openMenuCategoryId, setOpenMenuCategoryId] = useState<number | null>(
    null,
  );

  // Ref for the menu dropdown to handle click outside
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  /**
   * Close menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuCategoryId(null);
      }
    };

    if (openMenuCategoryId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuCategoryId]);

  /**
   * Toggle the expanded state of a category
   */
  const toggleCategoryExpansion = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the category selection
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  /**
   * Toggle the 3-dot menu for a category
   */
  const toggleCategoryMenu = (categoryId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  /**
   * Handle editing a category (opens modal)
   */
  const handleEditCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuCategoryId(null);
    setActiveCategory(cat);
    setIsAddModalOpen(true);
  };

  /**
   * Handle Disable Category action
   */
  const handleDisableCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuCategoryId(null);
    setActiveCategory(cat);
    setIsDisableModalOpen(true);
  };

  /**
   * Handle Delete Category action
   */
  const handleDeleteCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuCategoryId(null);
    setActiveCategory(cat);
    setIsDeleteModalOpen(true);
  };

  /**
   * Helper to find all parent category IDs for a given category ID
   */
  const findParentIds = (
    targetId: number,
    cats: Category[],
    parentIds: number[] = [],
  ): number[] | null => {
    for (const cat of cats) {
      if (cat.id === targetId) {
        return parentIds;
      }
      if (cat.subCategories && cat.subCategories.length > 0) {
        const found = findParentIds(targetId, cat.subCategories, [
          ...parentIds,
          cat.id,
        ]);
        if (found) return found;
      }
    }
    return null;
  };

  /**
   * Auto-expand parent categories when a child is selected
   */
  useEffect(() => {
    if (selectedCategoryId) {
      const parentIds = findParentIds(selectedCategoryId, categories);
      if (parentIds && parentIds.length > 0) {
        setExpandedCategories((prev) => {
          const newSet = new Set(prev);
          parentIds.forEach((id) => newSet.add(id));
          return newSet;
        });
      }
    }
  }, [selectedCategoryId, categories]);

  /**
   * Filters categories recursively based on name.
   */
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;

    const filterRecursive = (list: Category[]): Category[] => {
      return list.reduce((acc: Category[], cat) => {
        const matches = cat.name
          .toLowerCase()
          .includes(categorySearch.toLowerCase());
        const filteredSubs = cat.subCategories
          ? filterRecursive(cat.subCategories)
          : [];

        if (matches || filteredSubs.length > 0) {
          acc.push({
            ...cat,
            subCategories: filteredSubs,
          });
        }
        return acc;
      }, []);
    };

    return filterRecursive(categories);
  }, [categories, categorySearch]);

  /**
   * Check if a category is expanded (either manually or via search)
   */
  const isCategoryExpanded = (cat: Category): boolean => {
    return expandedCategories.has(cat.id);
  };

  /**
   * Recursive function to render a category and its subcategories.
   */
  const renderCategory = (cat: Category, depth = 0) => {
    const isSelected = selectedCategoryId === cat.id;
    const hasSubCategories = cat.subCategories && cat.subCategories.length > 0;
    const isExpanded = isCategoryExpanded(cat);
    const isMenuOpen = openMenuCategoryId === cat.id;
    const isInactive = cat.status === "inactive";

    return (
      <div key={cat.id}>
        {/* Individual Category/Subcategory Item */}
        <div
          className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all relative ${isMenuOpen ? "z-50" : "z-auto"} ${
            isSelected
              ? "bg-blue-50/50 dark:bg-blue-600/20 border-l-4 border-[var(--color-primary-blue)]"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"
          } ${isInactive ? "opacity-50 grayscale-[0.5]" : ""}`}
          style={{ paddingLeft: `${depth * 1 + 1}rem` }}
          onClick={() => {
            setSelectedCategoryId(cat.id);
            // Auto-expand category when selected (if it has subcategories)
            if (hasSubCategories) {
              setExpandedCategories((prev) => {
                const newSet = new Set(prev);
                newSet.add(cat.id);
                return newSet;
              });
            }
            if (window.innerWidth < 768) onClose?.();
          }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isInactive && (
              <EyeOff className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            )}
            <span
              className={`text-sm font-bold truncate ${isSelected ? "text-[var(--color-primary-blue)] dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
            >
              {cat.name} ({cat.itemCount})
            </span>
          </div>
          {/* Hover actions for category management */}
          <div className="flex items-center gap-1">
            {/* 3-dot Menu Button */}
            <div className="relative" ref={isMenuOpen ? menuRef : null}>
              <button
                className={`p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity ${isMenuOpen ? "opacity-100 bg-slate-200 dark:bg-slate-700" : "opacity-0 group-hover:opacity-100"}`}
                onClick={(e) => toggleCategoryMenu(cat.id, e)}
              >
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Edit Category */}
                  <button
                    onClick={(e) => handleEditCategory(cat, e)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-slate-400" />
                    {t("dashboard.menuEditor.categoryMenu.edit")}
                  </button>

                  {/* Disable/Enable Category */}
                  <button
                    onClick={(e) => handleDisableCategory(cat, e)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-t border-slate-100 dark:border-slate-700 ${isInactive ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}
                  >
                    {isInactive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    {isInactive
                      ? t("dashboard.menuEditor.categoryMenu.enable")
                      : t("dashboard.menuEditor.categoryMenu.disable")}
                  </button>

                  {/* Delete Category */}
                  <button
                    onClick={(e) => handleDeleteCategory(cat, e)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-slate-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("dashboard.menuEditor.categoryMenu.delete")}
                  </button>
                </div>
              )}
            </div>

            {hasSubCategories && (
              <button
                onClick={(e) => toggleCategoryExpansion(cat.id, e)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                aria-label={
                  isExpanded ? "Collapse subcategories" : "Expand subcategories"
                }
              >
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Render subcategories with accordion animation */}
        {hasSubCategories && (
          <div
            className={`transition-all duration-200 ease-in-out ${
              isExpanded
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            } ${openMenuCategoryId !== null ? "overflow-visible" : "overflow-hidden"}`}
          >
            <div className="bg-slate-50/50 dark:bg-slate-800/30 py-1">
              {cat.subCategories?.map((sub) => renderCategory(sub, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-opacity duration-200 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Header with Close Button (Mobile Only) */}
      <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
          {t("dashboard.menuEditor.categories")}
        </span>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Menu Health Score Indicator (Synced with MenuScore page) */}
      {!hideScore && (
        <div
          onClick={() => {
            const basePath = location.pathname.includes("/grow-with-ustart")
              ? "/grow-with-ustart/upload-menu"
              : "/dashboard/menu";
            navigate(basePath);
          }}
          className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-terracotta-green)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                {t("dashboard.menuEditor.menuHealth")}
              </span>
            </div>
            <span className="text-xs font-black text-[var(--color-terracotta-green)]">
              {score}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-terracotta-green)] transition-all duration-1000"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-[10px] mt-2 font-bold text-slate-500 uppercase">
            {t("dashboard.menuEditor.statusLabel")}:{" "}
            <span className="text-[var(--color-primary-blue)] dark:text-white">
              {status}
            </span>
          </p>
        </div>
      )}

      {/* Header section with total category count and "Add Category" action */}
      <div className="p-6 px-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-around gap-2">
        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
          {t("dashboard.menuEditor.categories")} ({categories.length})
        </h3>
        <button
          onClick={() => {
            setActiveCategory(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 text-[var(--color-primary-blue)] dark:text-blue-400 text-[10px] font-black uppercase tracking-wider py-1.5 px-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("dashboard.menuEditor.addCategory")}
        </button>
      </div>

      {/* Category Search Box */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t("dashboard.menuEditor.searchCategories")}
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[var(--color-primary-blue)] transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Scrollable list of categories and subcategories */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => renderCategory(cat))
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-xs text-slate-400 font-medium italic">
              {t("dashboard.menuEditor.noCategoriesFound")}
            </p>
          </div>
        )}
      </div>

      {/* Footer action to navigate to Add-ons section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => navigate('/dashboard/menu/addons')}
          className="w-full flex items-center justify-between text-[var(--color-primary-blue)] dark:text-blue-400 text-sm font-black py-4 px-2 hover:translate-x-1 transition-transform group"
        >
          {t("dashboard.menuEditor.goToAddOns")}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <AddCategoryModal
        isOpen={isAddModalOpen}
        category={activeCategory}
        onClose={() => {
          setIsAddModalOpen(false);
          setActiveCategory(null);
        }}
      />

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        category={activeCategory}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveCategory(null);
        }}
      />

      <DisableCategoryModal
        isOpen={isDisableModalOpen}
        category={activeCategory}
        onClose={() => {
          setIsDisableModalOpen(false);
          setActiveCategory(null);
        }}
      />
    </div>
  );
};
