import { z } from 'zod';
import type { TFunction } from 'i18next';
import type { BrandDetail, BrandUpdate } from '../../api/outletInfoApi';

/**
 * 2026-11-12: Brand Details edit form - rules (mirroring the backend's BrandUpdateRequestDTO
 * patterns), the pipe-joined registered address (onboarding's order:
 * line1|line2|landmark|locality|state|pincode), and the "changed fields only" diff, so an
 * untouched field is never sent (an unchanged brand isn't sent for approval).
 */
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const CIN = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const FSSAI = /^[0-9]{14}$/;

const ADDRESS_PARTS = ['line1', 'line2', 'landmark', 'locality', 'state', 'pincode'] as const;

export const splitAddress = (address?: string) => {
    const parts = (address ?? '').split('|');
    // Older plain-text addresses (no pipes) land in line 1.
    return Object.fromEntries(ADDRESS_PARTS.map((key, i) => [key, (parts[i] ?? '').trim()])) as Record<typeof ADDRESS_PARTS[number], string>;
};

const joinAddress = (a: Record<typeof ADDRESS_PARTS[number], string>) =>
    ADDRESS_PARTS.map((key) => a[key].trim()).join('|');

/** Local "today" as yyyy-MM-dd (the date input's format), for the expiry's "in the future" rule. */
const localToday = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const imageValue = z.union([z.instanceof(File), z.string()]).optional();

export const createBrandSchema = (t: TFunction) => {
    const k = 'dashboard.outletInfo.brand.errors.';
    return z.object({
        brandName: z.string().trim().min(2, t(`${k}brandName`)),
        companyName: z.string().trim().min(2, t(`${k}companyName`)),
        cinNumber: z.string().trim().toUpperCase().refine((v) => v === '' || CIN.test(v), t(`${k}cin`)),
        panNumber: z.string().trim().toUpperCase().regex(PAN, t(`${k}pan`)),
        gstNumber: z.string().trim().toUpperCase().refine((v) => v === '' || GST.test(v), t(`${k}gst`)),
        description: z.string().max(500, t(`${k}description`)),
        address: z.object({
            line1: z.string().trim().min(3, t(`${k}address`)),
            line2: z.string().trim(),
            landmark: z.string().trim(),
            locality: z.string().trim().min(2, t(`${k}address`)),
            state: z.string().trim().min(2, t(`${k}address`)),
            pincode: z.string().regex(/^\d{6}$/, t(`${k}pincode`)),
        }),
        fssaiNumber: z.string().refine((v) => v === '' || FSSAI.test(v), t(`${k}fssaiNumber`)),
        fssaiExpiryDate: z.string().refine((v) => v === '' || v > localToday(), t(`${k}fssaiExpiry`)),
        brandLogo: imageValue,
        primaryImage: imageValue,
        fssaiLicenseImage: imageValue,
    });
};
export type BrandFormValues = z.infer<ReturnType<typeof createBrandSchema>>;

export const brandFormDefaults = (brand: BrandDetail): BrandFormValues => ({
    brandName: brand.brandName ?? '',
    companyName: brand.companyName ?? '',
    cinNumber: brand.cinNumber ?? '',
    panNumber: brand.panNumber ?? '',
    gstNumber: brand.gstNumber ?? '',
    description: brand.description ?? '',
    address: splitAddress(brand.address),
    fssaiNumber: brand.fssaiNumber ?? '',
    fssaiExpiryDate: brand.fssaiExpiryDate ?? '',
    brandLogo: brand.brandLogo,
    primaryImage: brand.primaryImage,
    fssaiLicenseImage: brand.fssaiLicenseImage,
});

type TextField = 'brandName' | 'companyName' | 'cinNumber' | 'panNumber' | 'gstNumber' | 'description' | 'fssaiNumber' | 'fssaiExpiryDate';
const TEXT_FIELDS: TextField[] = ['brandName', 'companyName', 'cinNumber', 'panNumber', 'gstNumber', 'description', 'fssaiNumber', 'fssaiExpiryDate'];

/**
 * Text fields that differ from the stored brand. An emptied optional field isn't sent (the backend
 * treats a missing field as "unchanged" and can't clear these). Images are handled by the caller
 * (only new Files are uploaded and sent).
 */
export const changedText = (values: BrandFormValues, brand: BrandDetail): BrandUpdate => {
    const update: BrandUpdate = {};
    for (const field of TEXT_FIELDS) {
        const next = values[field].trim();
        if (next !== '' && next !== (brand[field] ?? '')) update[field] = next;
    }
    // Compared in the split form, so an old plain-text address that wasn't touched isn't "changed"
    // just because re-joining adds the empty pipe parts.
    const address = joinAddress(values.address);
    if (address !== joinAddress(splitAddress(brand.address))) update.address = address;
    return update;
};
