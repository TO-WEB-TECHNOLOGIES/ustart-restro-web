import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OtpInput } from "@/components/ui/otp-input";
import { getErrorMessage } from "@/utils/error";
import { outletInfoApi, type ContactChannel } from "../../api/outletInfoApi";

/**
 * 2026-11-12: OTP check of one mobile number or email before a manager / POC is saved (user
 * request). A code goes to that number / address, the person reads it out, the partner types it here
 * (POST /api/v1/contact-verification/send + /verify). Never a login for the person.
 * - `verified` comes from the parent (it tracks which values were verified, so editing the field
 *   back to a verified value - or an unchanged existing one - needs no new code).
 * - `valid`: the value passes the form's format check; until then there's nothing to send.
 * Resend is allowed after 60 s (the backend's per-number cooldown).
 * 2026-11-13 (user feedback): two pieces placed separately - `inline` (the "Send code" link /
 * "Verified", right under the field's input) and `box` (the code entry, shown below the form's
 * fields at full width, so the inputs never move or resize). useVerifyContact returns both;
 * VerifyContactField renders them together for single-column forms (the add-outlet manager pop-up).
 * Own file because react-refresh needs component files to export components only.
 */
export interface VerifyContactOptions {
  channel: ContactChannel;
  value: string;
  valid: boolean;
  verified: boolean;
  onVerified: (value: string) => void;
}

const RESEND_SECONDS = 60;

export const useVerifyContact = ({ channel, value, valid, verified, onVerified }: VerifyContactOptions): { inline: ReactNode; box: ReactNode } => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.verify.";
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [wait, setWait] = useState(0);
  const codeSent = sentTo !== null && sentTo === value;

  // Resend countdown (only while a code for this value is out).
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = async () => {
    setBusy("send");
    try {
      await outletInfoApi.sendContactCode(channel, value);
      setSentTo(value);
      setOtp("");
      setWait(RESEND_SECONDS);
      toast.success(t(channel === "MOBILE" ? `${k}sentMobile` : `${k}sentEmail`, { value }));
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}sendFailed`)));
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    setBusy("verify");
    try {
      await outletInfoApi.verifyContactCode(channel, value, otp);
      onVerified(value);
    } catch (error) {
      setOtp("");
      toast.error(getErrorMessage(error, t(`${k}verifyFailed`)));
    } finally {
      setBusy(null);
    }
  };

  const linkClass = "text-xs font-bold text-secondary-orange hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1.5";

  if (verified) {
    return {
      inline: (
        <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          {t(`${k}verified`)}
        </p>
      ),
      box: null,
    };
  }
  if (!valid) return { inline: null, box: null };
  if (!codeSent) {
    return {
      inline: (
        <button type="button" onClick={send} disabled={busy !== null} className={linkClass}>
          {busy === "send" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t(channel === "MOBILE" ? `${k}sendMobile` : `${k}sendEmail`)}
        </button>
      ),
      box: null,
    };
  }
  return {
    // While the code is out, the field only says where to enter it.
    inline: <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t(`${k}codeBelow`)}</p>,
    box: (
      <div className="w-full space-y-2 rounded-xl bg-orange-50/60 dark:bg-orange-500/10 p-3">
        <p className="text-xs text-slate-600 dark:text-slate-300">{t(`${k}enterCode`, { value })}</p>
        <div className="flex flex-wrap items-center gap-3">
          <OtpInput length={4} value={otp} onChange={setOtp} />
          <button
            type="button"
            onClick={verify}
            disabled={otp.length < 4 || busy !== null}
            className="h-10 px-4 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy === "verify" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t(`${k}verify`)}
          </button>
        </div>
        <button type="button" onClick={send} disabled={wait > 0 || busy !== null} className={linkClass}>
          {wait > 0 ? t(`${k}resendIn`, { seconds: wait }) : t(`${k}resend`)}
        </button>
      </div>
    ),
  };
};
