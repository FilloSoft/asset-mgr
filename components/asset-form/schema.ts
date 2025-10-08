import { z } from "zod";

import type { Asset as AssetRecord } from "@/db/schema";

export const statusOptions = [
  "active",
  "inactive",
  "maintenance",
  "retired",
] as const;

function coordinateSchema(
  min: number,
  max: number,
  emptyMessage: string,
  invalidMessage: string,
  rangeMessage: string,
) {
  return z
    .string()
    .min(1, emptyMessage)
    .trim()
    .transform((value, ctx) => {
      const parsed = Number(value);

      if (Number.isNaN(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: invalidMessage });
        return z.NEVER;
      }

      if (parsed < min || parsed > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: rangeMessage });
        return z.NEVER;
      }

      return parsed;
    });
}

export const assetFormSchema = z.object({
  name: z.string().min(1, "Asset name is required").trim(),
  description: z.string().min(1, "Asset description is required").trim(),
  taxDecNo: z.string().min(1, "Tax declaration number is required").trim(),
  taxDeclarationNo: z
    .string()
    .min(1, "Recorded tax declaration number is required")
    .trim(),
  declaredOwner: z.string().min(1, "Declared owner is required").trim(),
  marketValue: z.string().min(1, "Market value is required").trim(),
  assessedValue: z.string().min(1, "Assessed value is required").trim(),
  carStatus: z.string().trim().optional(),
  address: z.string().min(1, "Address is required").trim(),
  barangay: z.string().min(1, "Barangay is required").trim(),
  locationOfPropery: z
    .string()
    .min(1, "Location of property is required")
    .trim(),
  areaPerSqM: z.string().min(1, "Area per square meter is required").trim(),
  tctNo: z.string().min(1, "TCT number is required").trim(),
  bidder: z.string().min(1, "Bidder is required").trim(),
  entryNo: z.string().min(1, "Entry number is required").trim(),
  auctionDate: z
    .string()
    .min(1, "Auction date is required")
    .trim()
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      "Invalid date",
    ),
  dateOfCertificationOfSale: z
    .string()
    .min(1, "Certification of sale date is required")
    .trim()
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      "Invalid date",
    ),
  detailsShortUpdateLog: z
    .string()
    .min(1, "Details short update log is required")
    .trim(),
  location: z.object({
    lat: coordinateSchema(
      -90,
      90,
      "Latitude is required",
      "Latitude must be a valid number",
      "Latitude must be between -90 and 90",
    ),
    lng: coordinateSchema(
      -180,
      180,
      "Longitude is required",
      "Longitude must be a valid number",
      "Longitude must be between -180 and 180",
    ),
  }),
  status: z.enum(statusOptions).default("active"),
});

export type AssetFormValues = z.input<typeof assetFormSchema>;
export type AssetSubmitPayload = z.output<typeof assetFormSchema>;

export type AssetFormAsset = Partial<
  Omit<
    AssetRecord,
    | "auctionDate"
    | "dateOfCertificationOfSale"
    | "createdAt"
    | "updatedAt"
    | "location"
  >
> & {
  auctionDate?: Date | string | null;
  dateOfCertificationOfSale?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  location?: Partial<AssetRecord["location"]>;
};

export function formatDateTimeLocal(value?: Date | string | null): string {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMinutes = date.getTimezoneOffset();
  const localTime = new Date(date.getTime() - offsetMinutes * 60_000);

  return localTime.toISOString().slice(0, 16);
}

export function getInitialFormValues(asset?: AssetFormAsset): AssetFormValues {
  const latValue = asset?.location?.lat;
  const lngValue = asset?.location?.lng;

  return {
    name: asset?.name ?? "",
    description: asset?.description ?? "",
    taxDecNo: asset?.taxDecNo ?? "",
    taxDeclarationNo: asset?.taxDeclarationNo ?? "",
    declaredOwner: asset?.declaredOwner ?? "",
    marketValue: asset?.marketValue ?? "",
    assessedValue: asset?.assessedValue ?? "",
    carStatus: asset?.carStatus ?? "",
    address: asset?.address ?? "",
    barangay: asset?.barangay ?? "",
    locationOfPropery: asset?.locationOfPropery ?? "",
    areaPerSqM: asset?.areaPerSqM ?? "",
    tctNo: asset?.tctNo ?? "",
    bidder: asset?.bidder ?? "",
    entryNo: asset?.entryNo ?? "",
    auctionDate: formatDateTimeLocal(asset?.auctionDate ?? null),
    dateOfCertificationOfSale: formatDateTimeLocal(
      asset?.dateOfCertificationOfSale ?? null,
    ),
    detailsShortUpdateLog: asset?.detailsShortUpdateLog ?? "",
    location: {
      lat: latValue !== undefined && latValue !== null ? String(latValue) : "",
      lng: lngValue !== undefined && lngValue !== null ? String(lngValue) : "",
    },
    status: asset?.status ?? "active",
  };
}
