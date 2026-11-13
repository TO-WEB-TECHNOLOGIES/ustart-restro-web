import { useVerifyContact, type VerifyContactOptions } from "./useVerifyContact";

/**
 * 2026-11-12: OTP check of a manager's / POC's mobile or email (see useVerifyContact). This wrapper is
 * for single-column forms (the add-outlet manager pop-up): the "Send code" link and the code box
 * stacked right under the field. Two-column forms use the hook to put the box below all fields.
 */
/** Single-column forms: the link and the code box stacked right under the field. */
export const VerifyContactField = (props: VerifyContactOptions) => {
  const { inline, box } = useVerifyContact(props);
  return (
    <>
      {inline}
      {box}
    </>
  );
};
