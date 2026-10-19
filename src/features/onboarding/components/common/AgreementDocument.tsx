import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { PersonalInfoValues } from "../../schemas";
import type { RestaurantInfoState } from "../../store/useOnboardingStore";

// react-pdf's default hyphenation engine can break a word mid-syllable ("CONTRACT" -> "CONTR-
// ACT") when its dictionary doesn't recognize it - this disables hyphenation entirely so text
// only ever wraps at word boundaries, never mid-word. Applies globally to every <Text> in the app
// (module-level, runs once), which is the correct scope for a legal document.
Font.registerHyphenationCallback((word) => [word]);

export interface AgreementTemplate {
  ustartPartyRecitalText: string;
  foundingPartnerRecognitionText: string[];
  founderBenefits: string[];
  founderBenefitsDisclaimerText: string;
  partnerPrinciplesText: string[];
  keyAcknowledgements: string[];
  declarationText: string[];
  // data: URI (base64) for USTART's own "Authorized Representative" signature - fetched as part
  // of this same authenticated response, never as a standalone file/URL. See
  // AgreementTemplateResponseDTO on the backend.
  authorizedRepresentativeSignatureImageDataUri?: string;
}

interface AgreementDocumentDocuments {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  fssaiNumber?: string;
  fssaiExpiryDate?: string;
}

interface AgreementDocumentProps {
  template: AgreementTemplate;
  restaurantInfo: RestaurantInfoState;
  personalInfo: PersonalInfoValues;
  documents: AgreementDocumentDocuments;
  // Only present once the user has actually e-signed - the live preview renders the cursive
  // signature line blank until then. Date fields don't wait on this - see todayFormatted below.
  signature?: { name: string };
}

// Modeled directly on _USTART_PARTNER_AGREEMENT_.pdf (repo root) - left-aligned title,
// justified body text, plain bold (not colored/oversized) section headers, a bordered table for
// structured data (Food Business Information / Banking Details), generous but consistent
// spacing built off one base unit (12pt) rather than ad-hoc values per element.
const UNIT = 12;
const styles = StyleSheet.create({
  page: { paddingTop: 68, paddingBottom: 60, paddingHorizontal: 56, fontSize: 10.5, fontFamily: "Helvetica", color: "#1a1a1a" },
  title: { fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: UNIT * 1.5, lineHeight: 1.25 },
  subtitle: { fontSize: 10.5, textAlign: "left", marginBottom: UNIT, lineHeight: 1.5 },
  andSeparator: { fontSize: 10.5, fontWeight: 700, textAlign: "center", marginBottom: UNIT },
  tagline: { fontSize: 13, fontWeight: 700, textAlign: "left", marginTop: UNIT * 0.5, marginBottom: UNIT * 1.5 },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginTop: UNIT * 2, marginBottom: UNIT },
  // >= the line-height gap between wrapped lines of one paragraph (10.5 * 1.5 ~= 15.75), so a
  // paragraph break is clearly wider than a normal line wrap, not visually equal to or tighter
  // than one - that was what made spacing feel "off" before.
  paragraph: { marginBottom: UNIT * 1.5, lineHeight: 1.5, textAlign: "justify" },
  bullet: { flexDirection: "row", marginBottom: UNIT * 0.85 },
  bulletMarker: { width: 12 },
  bulletText: { flex: 1, lineHeight: 1.55 },
  fieldRow: { marginBottom: UNIT, lineHeight: 1.4 },
  fieldRowLabel: { fontWeight: 700 },
  signatureBlock: { marginTop: UNIT * 2 },
  signatureName: { fontFamily: "Times-Italic", fontSize: 16, marginBottom: 6 },
  partyLabel: { fontSize: 12.5, fontWeight: 700, marginBottom: UNIT },
  stampNote: { fontSize: 10.5, marginTop: 6, marginBottom: 4 },
  signatureImage: { width: 120, height: 48, marginBottom: 6 },
  // Grid built from per-side borders (table: top+left, row: bottom, cell: right) rather than a
  // border on every element, so lines don't double up between adjacent cells/rows.
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#cbd5e1", marginBottom: UNIT * 1.5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#cbd5e1" },
  tableLabelCell: {
    width: "38%", padding: 7, borderRightWidth: 1, borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc", fontWeight: 700, lineHeight: 1.3,
  },
  tableValueCell: { flex: 1, padding: 7, borderRightWidth: 1, borderColor: "#cbd5e1", lineHeight: 1.3 },
});

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <Text style={styles.fieldRow}>
    <Text style={styles.fieldRowLabel}>{label}: </Text>
    {value || ""}
  </Text>
);

const TableRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  // wrap={false}: a row must move to the next page as a whole, never split mid-row.
  <View style={styles.tableRow} wrap={false}>
    <Text style={styles.tableLabelCell}>{label}</Text>
    <Text style={styles.tableValueCell}>{value || ""}</Text>
  </View>
);

const formatPipeAddress = (value?: string) => {
  if (!value) return "";
  return value.split("|").map((s) => s.trim()).filter(Boolean).join(", ");
};

// Always renders in IST (Asia/Kolkata), regardless of the viewer's own browser timezone - this
// is a legal document for an Indian entity, and without an explicit timeZone, toLocaleDateString
// falls back to the browser's local zone, which can shift a date across a day boundary.
const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
};

export const AgreementDocument = ({
  template,
  restaurantInfo,
  personalInfo,
  documents,
  signature,
}: AgreementDocumentProps) => {
  const signatoryName = personalInfo.isAuthorizedSignatory
    ? personalInfo.fullName
    : personalInfo.authorizedSignatoryName || "";
  const signatoryEmail = personalInfo.isAuthorizedSignatory
    ? personalInfo.email
    : personalInfo.authorizedSignatoryEmail || "";
  const signatoryMobile = personalInfo.isAuthorizedSignatory
    ? personalInfo.mobile
    : personalInfo.authorizedSignatoryMobile || "";

  // Designation is stored bilingually ("Owner / मालिक") - the legal document only takes the
  // English half, same split already applied to the submission payload in AboutRestaurant.tsx.
  const designation = personalInfo.designation?.split(" / ")[0] || personalInfo.designation;

  // Both signature blocks' Date fields show today's date (document generation/signing time),
  // rather than waiting on the e-sign action - keeps the live preview from showing a blank date.
  const todayFormatted = formatDate(new Date().toISOString());

  const outletAddress = formatPipeAddress(restaurantInfo.restaurantAddress || restaurantInfo.registeredAddress);
  const registeredAddress = formatPipeAddress(restaurantInfo.registeredAddress);
  const businessName = restaurantInfo.companyName || restaurantInfo.restaurantName || "";

  return (
    <Document title="USTART RESTAURANT PARTNER CONTRACT">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>USTART RESTAURANT PARTNER CONTRACT</Text>
        <Text style={styles.subtitle}>This Enrollment & Participation Form ("Form") is entered into between:</Text>

        <Text style={styles.paragraph}>{template.ustartPartyRecitalText}</Text>
        <Text style={styles.andSeparator}>AND</Text>
        <Text style={styles.paragraph}>
          {businessName || "the Food Business Partner"}, a Restaurant / Cloud Kitchen / Bakery / Sweet Shop /
          Food Business Operator, having its principal place of business at{" "}
          {registeredAddress || "the address provided"} (hereinafter referred to as the "Food Business Partner" or
          "Partner", which expression shall, unless repugnant to the context or meaning thereof, include its
          successors, legal representatives, and permitted assigns).
        </Text>
        <Text style={styles.paragraph}>
          USTART and the Food Business Partner are hereinafter individually referred to as a "Party" and
          collectively referred to as the "Parties".
        </Text>

        <Text style={styles.tagline}>Building a Transparent, Ethical, and Growth-Focused Food Ecosystem Together</Text>

        <Text style={styles.sectionTitle}>Founding Partner Recognition</Text>
        {template.foundingPartnerRecognitionText.map((paragraph, idx) => (
          <Text key={idx} style={styles.paragraph}>{paragraph}</Text>
        ))}

        {template.founderBenefits.map((benefit, idx) => (
          // wrap={false}: a bullet must move to the next page as a whole, never split with its
          // marker on one page and text on the next.
          <View key={idx} style={styles.bullet} wrap={false}>
            <Text style={styles.bulletMarker}>•</Text>
            <Text style={styles.bulletText}>{benefit}</Text>
          </View>
        ))}
        <Text style={styles.paragraph}>{template.founderBenefitsDisclaimerText}</Text>

        <Text style={styles.sectionTitle}>USTART Partner Principles</Text>
        {template.partnerPrinciplesText.map((paragraph, idx) => (
          <Text key={idx} style={styles.paragraph}>{paragraph}</Text>
        ))}

        <Text style={styles.sectionTitle}>Food Business Information</Text>
        <View style={styles.table}>
          <TableRow label="Business Name" value={businessName} />
          <TableRow label="Trade Name / Brand Name" value={restaurantInfo.restaurantName} />
          <TableRow label="Owner / Authorized Signatory" value={signatoryName} />
          <TableRow label="Mobile Number" value={signatoryMobile} />
          <TableRow label="Email Address" value={signatoryEmail} />
          <TableRow label="Outlet Address" value={outletAddress} />
          <TableRow label="GST Number" value={restaurantInfo.gstNumber || "N/A"} />
          <TableRow label="PAN Number" value={restaurantInfo.panNumber} />
          <TableRow label="FSSAI Number" value={documents.fssaiNumber} />
          <TableRow label="FSSAI Expiry Date" value={formatDate(documents.fssaiExpiryDate)} />
        </View>

        <Text style={styles.sectionTitle}>Banking Details</Text>
        <View style={styles.table}>
          <TableRow label="Account Holder Name" value={documents.accountHolderName} />
          <TableRow label="Bank Name" value={documents.bankName} />
          <TableRow label="Account Number" value={documents.accountNumber} />
          <TableRow label="IFSC Code" value={documents.ifscCode} />
        </View>

        <Text style={styles.sectionTitle}>Key Participation Acknowledgements</Text>
        <Text style={styles.paragraph}>By joining the USTART Platform, the Food Business Partner acknowledges that:</Text>
        {template.keyAcknowledgements.map((ack, idx) => (
          <View key={idx} style={styles.bullet} wrap={false}>
            <Text style={styles.bulletMarker}>•</Text>
            <Text style={styles.bulletText}>{ack}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Declaration & Acceptance</Text>
        {template.declarationText.map((paragraph, idx) => (
          <Text key={idx} style={styles.paragraph}>{paragraph}</Text>
        ))}

        {/* wrap={false}: each signature block must move to the next page as a whole rather than
            splitting partway through - same fix as the bullet points above. */}
        <View style={styles.signatureBlock} wrap={false}>
          <Text style={styles.partyLabel}>Food Business Partner</Text>
          <Field label="Authorized Signatory" value={signatoryName} />
          <Field label="Designation" value={designation} />
          <Text style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Signature: </Text>
          </Text>
          <Text style={styles.signatureName}>{signature?.name || ""}</Text>
          <Field label="Date" value={todayFormatted} />
          {/* The Food Business Partner's own company stamp, if they have one - optional, and
              necessarily physical/added by them on a printed copy, not something rendered here. */}
          <Text style={styles.stampNote}>Company Stamp (if applicable)</Text>
        </View>

        <View style={styles.signatureBlock} wrap={false}>
          <Text style={styles.partyLabel}>For Toweb Technology Private Limited{"\n"}(Operating under the brand name USTART)</Text>
          <Text style={[styles.fieldRow, styles.fieldRowLabel]}>Authorized Representative</Text>
          <Text style={styles.fieldRow}>
            <Text style={styles.fieldRowLabel}>Signature: </Text>
          </Text>
          {template.authorizedRepresentativeSignatureImageDataUri && (
            <Image style={styles.signatureImage} src={template.authorizedRepresentativeSignatureImageDataUri} />
          )}
          <Field label="Date" value={todayFormatted} />
        </View>
      </Page>
    </Document>
  );
};
