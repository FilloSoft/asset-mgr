import type { AssetFormValues } from "./schema";

export type FormErrors = Record<string, string>;

export type FieldChangeHandler = (
  field: keyof AssetFormValues,
  value: string,
) => void;

export type LocationChangeHandler = (
  axis: "lat" | "lng",
  value: string,
) => void;
