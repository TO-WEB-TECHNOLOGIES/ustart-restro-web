import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User, PencilLine, X, ChevronDown, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { type ManagerInfo } from "../../store/useOnboardingStore";

interface ManagerDetailsProps {
  isUserManaging: boolean;
  onToggleManaging: (val: boolean) => void;
  // Details of the *current* manager being displayed (if not user managing)
  managerDetails: Partial<ManagerInfo>;
  // Existing managers list (for dropdown)
  managersList?: ManagerInfo[];
  // Callback when a manager is selected from dropdown
  onSelectManagerFromList?: (manager: ManagerInfo) => void;
  // Callback when "Save" is clicked in the modal (for New or Edit)
  onSaveManager: (manager: ManagerInfo) => void;
  // Callback for removing a manager (clearing selection)
  onRemoveManager?: () => void;
  // Owner user info
  user?: { name?: string; mobile?: string };
}

export const ManagerDetails = ({
  isUserManaging,
  onToggleManaging,
  managerDetails,
  managersList = [],
  onSelectManagerFromList,
  onSaveManager,
  onRemoveManager,
  user,
}: ManagerDetailsProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isWhatsAppSame, setIsWhatsAppSame] = useState(false);

  // Local state for the modal form
  const [newManager, setNewManager] = useState<Partial<ManagerInfo>>({
    name: "",
    email: "",
    mobile: "",
    whatsapp: "",
  });

  const maskMobile = (mobile: string) => {
    if (!mobile) return "";
    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length < 4) return mobile;
    return `XXXXXX${cleanMobile.slice(-4)}`;
  };

  const handleEditManager = () => {
    setNewManager({
      name: managerDetails.name || "",
      email: managerDetails.email || "",
      mobile: managerDetails.mobile || "",
      whatsapp: managerDetails.whatsapp || "",
    });
    setIsWhatsAppSame(
      managerDetails.mobile === managerDetails.whatsapp &&
        !!managerDetails.mobile,
    );
    setIsEditingExisting(true);
    setIsModalOpen(true);
  };

  const handleAddNewManager = () => {
    setNewManager({ name: "", email: "", mobile: "", whatsapp: "" });
    setIsWhatsAppSame(false);
    setIsEditingExisting(false);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newManager.name || !newManager.mobile) return;

    const managerData = {
      isUserManaging: false,
      ...newManager,
      whatsapp: isWhatsAppSame ? newManager.mobile : newManager.whatsapp,
    } as ManagerInfo;

    onSaveManager(managerData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="space-y-1">
          <Label className="text-xl font-bold text-slate-800 uppercase tracking-wider">
            {t(
              "onboarding.restaurant.complete.setupForm.management.outletTitle",
            )}
          </Label>
          <p className="text-md text-slate-500">
            {t("onboarding.restaurant.complete.setupForm.management.hint")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
          <Tabs
            value={isUserManaging ? "ME" : "OTHERS"}
            onValueChange={(val) => onToggleManaging(val === "ME")}
            className="w-full sm:w-auto"
          >
            <TabsList className="flex w-full sm:w-auto inline-flex bg-slate-100/50 p-1.5 rounded-2xl gap-1.5 h-12">
              <TabsTrigger
                value="ME"
                className="flex-1 sm:flex-none px-8 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0F2441] data-[state=active]:shadow-sm font-bold text-sm transition-all"
              >
                {t("onboarding.restaurant.complete.setupForm.management.me")}
              </TabsTrigger>
              <TabsTrigger
                value="OTHERS"
                className="flex-1 sm:flex-none px-8 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0F2441] data-[state=active]:shadow-sm font-bold text-sm transition-all"
              >
                {t(
                  "onboarding.restaurant.complete.setupForm.management.someoneElse",
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Management Info Card */}
          <div className="w-full sm:min-w-[320px] p-2 bg-white border border-slate-200/60 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
            {isUserManaging ? (
              <div className="flex items-center justify-between pl-3 pr-2 py-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0F2441]/5 flex items-center justify-center border border-[#0F2441]/10">
                    <User className="w-5 h-5 text-[#0F2441]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {user?.name ||
                        t("onboarding.restaurant.complete.card.owner")}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {maskMobile(user?.mobile || "")}
                    </p>
                  </div>
                </div>
              </div>
            ) : managerDetails?.name ? (
              <div className="flex items-center justify-between pl-3 pr-2 py-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0F2441]/5 flex items-center justify-center border border-[#0F2441]/10">
                    <User className="w-5 h-5 text-[#0F2441]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {managerDetails.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {maskMobile(managerDetails.mobile || "")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleEditManager}
                    className="p-2 rounded-xl hover:bg-[#0F2441]/5 text-slate-400 hover:text-[#0F2441] transition-all flex items-center justify-center"
                  >
                    <PencilLine className="w-4 h-4" />
                  </button>
                  {onRemoveManager && (
                    <button
                      type="button"
                      onClick={onRemoveManager}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <select
                    className="w-full h-11 pl-4 pr-10 rounded-2xl bg-slate-50 border border-transparent text-xs font-bold text-slate-600 focus:bg-white focus:border-[#0F2441]/30 outline-none appearance-none transition-all cursor-pointer"
                    value=""
                    onChange={(e) => {
                      const selected = managersList.find(
                        (m) => m.mobile === e.target.value,
                      );
                      if (selected && onSelectManagerFromList) {
                        onSelectManagerFromList(selected);
                      }
                    }}
                  >
                    <option value="" disabled>
                      {t(
                        "onboarding.restaurant.complete.setupForm.management.selectManager",
                      )}
                    </option>
                    {managersList.map((mgr, idx) => (
                      <option key={mgr.mobile || idx} value={mgr.mobile}>
                        {mgr.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddNewManager}
                  className="h-11 w-11 rounded-2xl bg-[#0F2441]/5 text-[#0F2441] border border-[#0F2441]/10 hover:bg-[#0F2441]/10 transition-all flex items-center justify-center shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          isEditingExisting
            ? t(
                "onboarding.restaurant.complete.setupForm.management.editManager",
              )
            : t(
                "onboarding.restaurant.complete.setupForm.management.addNewManager",
              )
        }
      >
        <div className="space-y-4 py-2">
          {/* Using standard Input logic but styling to match the rest roughly */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              {t("onboarding.restaurant.complete.setupForm.management.name")}
            </Label>
            <div className="space-y-1.5">
              <Input
                placeholder={t(
                  "onboarding.restaurant.complete.setupForm.management.fullNamePlaceholder",
                )}
                value={newManager.name}
                onChange={(e) =>
                  setNewManager({ ...newManager, name: e.target.value })
                }
                className="block px-3 py-2.5 w-full text-sm text-gray-900 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF9F43] focus:border-[#FF9F43] transition-all h-auto"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              {t("onboarding.restaurant.complete.setupForm.management.email")}
            </Label>
            <Input
              type="email"
              placeholder={t(
                "onboarding.restaurant.complete.setupForm.management.emailPlaceholder",
              )}
              value={newManager.email}
              onChange={(e) =>
                setNewManager({ ...newManager, email: e.target.value })
              }
              className="block px-3 py-2.5 w-full text-sm text-gray-900 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF9F43] focus:border-[#FF9F43] transition-all h-auto"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              {t("onboarding.restaurant.complete.setupForm.management.mobile")}
            </Label>
            <Input
              placeholder={t(
                "onboarding.restaurant.complete.setupForm.management.mobilePlaceholder",
              )}
              value={newManager.mobile}
              onChange={(e) => {
                const val = e.target.value;
                setNewManager({ ...newManager, mobile: val });
                if (isWhatsAppSame)
                  setNewManager((prev) => ({ ...prev, whatsapp: val }));
              }}
              className="block px-3 py-2.5 w-full text-sm text-gray-900 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF9F43] focus:border-[#FF9F43] transition-all h-auto"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t(
                  "onboarding.restaurant.complete.setupForm.management.whatsapp",
                )}
              </Label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isWhatsAppSame}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsWhatsAppSame(checked);
                    if (checked)
                      setNewManager((prev) => ({
                        ...prev,
                        whatsapp: prev.mobile,
                      }));
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-[#0F2441] focus:ring-[#0F2441]/10 cursor-pointer"
                />
                <span className="text-[10px] font-medium text-slate-600 group-hover:text-[#0F2441] transition-colors">
                  {t(
                    "onboarding.restaurant.complete.setupForm.management.sameAsMobile",
                  )}
                </span>
              </label>
            </div>
            <Input
              placeholder={t(
                "onboarding.restaurant.complete.setupForm.management.whatsappPlaceholder",
              )}
              value={newManager.whatsapp}
              onChange={(e) =>
                setNewManager({ ...newManager, whatsapp: e.target.value })
              }
              disabled={isWhatsAppSame}
              className={`block px-3 py-2.5 w-full text-sm text-gray-900 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF9F43] focus:border-[#FF9F43] transition-all h-auto ${isWhatsAppSame ? "bg-slate-50 border-slate-100 text-slate-400" : ""}`}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              {t("onboarding.restaurant.complete.setupForm.management.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!newManager.name || !newManager.mobile}
              className="flex-[2] h-12 px-8 rounded-2xl bg-[#0F2441] text-white text-sm font-bold shadow-lg shadow-[#0F2441]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
            >
              {t(
                "onboarding.restaurant.complete.setupForm.management.saveManager",
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
