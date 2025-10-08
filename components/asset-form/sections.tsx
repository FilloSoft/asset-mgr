import { FormSection, SelectField, TextAreaField, TextField } from "./fields";
import type { AssetFormValues } from "./schema";
import type {
  FieldChangeHandler,
  FormErrors,
  LocationChangeHandler,
} from "./types";

const GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 gap-6";

interface SectionProps {
  values: AssetFormValues;
  errors: FormErrors;
  disabled: boolean;
  onFieldChange: FieldChangeHandler;
}

export function AssetDetailsSection(props: SectionProps) {
  const { values, errors, disabled, onFieldChange } = props;

  return (
    <FormSection title="Asset Details">
      <div className="space-y-6">
        <TextField
          id="name"
          label="Asset Name"
          value={values.name}
          onChange={(value) => onFieldChange("name", value)}
          error={errors.name}
          placeholder="Enter asset name"
          disabled={disabled}
          required
        />
        <TextAreaField
          id="description"
          label="Description"
          value={values.description}
          onChange={(value) => onFieldChange("description", value)}
          error={errors.description}
          placeholder="Enter asset description"
          disabled={disabled}
          rows={3}
          required
        />
      </div>
    </FormSection>
  );
}

export function PropertyInformationSection(props: SectionProps) {
  const { values, errors, disabled, onFieldChange } = props;

  return (
    <FormSection title="Property Information">
      <div className={GRID_CLASS}>
        <TextField
          id="taxDecNo"
          label="Tax Declaration Number"
          value={values.taxDecNo}
          onChange={(value) => onFieldChange("taxDecNo", value)}
          error={errors.taxDecNo}
          placeholder="Enter tax declaration number"
          disabled={disabled}
          required
        />
        <TextField
          id="taxDeclarationNo"
          label="Tax Declaration Number (Recorded)"
          value={values.taxDeclarationNo}
          onChange={(value) => onFieldChange("taxDeclarationNo", value)}
          error={errors.taxDeclarationNo}
          placeholder="Enter recorded tax declaration number"
          disabled={disabled}
          required
        />
        <TextField
          id="declaredOwner"
          label="Declared Owner"
          value={values.declaredOwner}
          onChange={(value) => onFieldChange("declaredOwner", value)}
          error={errors.declaredOwner}
          placeholder="Enter declared owner"
          disabled={disabled}
          required
        />
        <TextField
          id="marketValue"
          label="Market Value"
          value={values.marketValue}
          onChange={(value) => onFieldChange("marketValue", value)}
          error={errors.marketValue}
          placeholder="Enter market value"
          disabled={disabled}
          required
        />
        <TextField
          id="assessedValue"
          label="Assessed Value"
          value={values.assessedValue}
          onChange={(value) => onFieldChange("assessedValue", value)}
          error={errors.assessedValue}
          placeholder="Enter assessed value"
          disabled={disabled}
          required
        />
        <TextField
          id="carStatus"
          label="CAR Status (optional)"
          value={values.carStatus ?? ""}
          onChange={(value) => onFieldChange("carStatus", value)}
          error={errors.carStatus}
          placeholder="Enter CAR status"
          disabled={disabled}
        />
        <TextField
          id="address"
          label="Address"
          value={values.address}
          onChange={(value) => onFieldChange("address", value)}
          error={errors.address}
          placeholder="Enter property address"
          disabled={disabled}
          required
          className="md:col-span-2"
        />
        <TextField
          id="barangay"
          label="Barangay"
          value={values.barangay}
          onChange={(value) => onFieldChange("barangay", value)}
          error={errors.barangay}
          placeholder="Enter barangay"
          disabled={disabled}
          required
        />
        <TextField
          id="locationOfPropery"
          label="Location of Property"
          value={values.locationOfPropery}
          onChange={(value) => onFieldChange("locationOfPropery", value)}
          error={errors.locationOfPropery}
          placeholder="Enter location of property"
          disabled={disabled}
          required
        />
        <TextField
          id="areaPerSqM"
          label="Area per Sq. M."
          value={values.areaPerSqM}
          onChange={(value) => onFieldChange("areaPerSqM", value)}
          error={errors.areaPerSqM}
          placeholder="Enter area per square meter"
          disabled={disabled}
          required
        />
        <TextField
          id="tctNo"
          label="TCT Number"
          value={values.tctNo}
          onChange={(value) => onFieldChange("tctNo", value)}
          error={errors.tctNo}
          placeholder="Enter TCT number"
          disabled={disabled}
          required
        />
      </div>
    </FormSection>
  );
}

export function AuctionSaleSection(props: SectionProps) {
  const { values, errors, disabled, onFieldChange } = props;

  return (
    <FormSection title="Auction & Sale Details">
      <div className={GRID_CLASS}>
        <TextField
          id="bidder"
          label="Bidder"
          value={values.bidder}
          onChange={(value) => onFieldChange("bidder", value)}
          error={errors.bidder}
          placeholder="Enter bidder name"
          disabled={disabled}
          required
        />
        <TextField
          id="entryNo"
          label="Entry Number"
          value={values.entryNo}
          onChange={(value) => onFieldChange("entryNo", value)}
          error={errors.entryNo}
          placeholder="Enter entry number"
          disabled={disabled}
          required
        />
        <TextField
          id="auctionDate"
          label="Auction Date"
          value={values.auctionDate}
          onChange={(value) => onFieldChange("auctionDate", value)}
          error={errors.auctionDate}
          type="datetime-local"
          disabled={disabled}
          required
        />
        <TextField
          id="dateOfCertificationOfSale"
          label="Certification of Sale Date"
          value={values.dateOfCertificationOfSale}
          onChange={(value) =>
            onFieldChange("dateOfCertificationOfSale", value)
          }
          error={errors.dateOfCertificationOfSale}
          type="datetime-local"
          disabled={disabled}
          required
        />
        <TextAreaField
          id="detailsShortUpdateLog"
          label="Details Short Update Log"
          value={values.detailsShortUpdateLog}
          onChange={(value) => onFieldChange("detailsShortUpdateLog", value)}
          error={errors.detailsShortUpdateLog}
          placeholder="Enter recent update details"
          disabled={disabled}
          rows={4}
          required
          className="md:col-span-2"
        />
      </div>
    </FormSection>
  );
}

export function StatusSection({
  values,
  errors,
  disabled,
  onFieldChange,
  options,
}: SectionProps & {
  options: ReadonlyArray<string>;
}) {
  return (
    <FormSection title="Asset Status">
      <SelectField
        id="status"
        label="Status"
        value={values.status!}
        onChange={(value) => onFieldChange("status", value)}
        disabled={disabled}
        error={errors.status}
        options={options.map((status) => ({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }))}
      />
    </FormSection>
  );
}

export function LocationSection({
  values,
  errors,
  disabled,
  onLocationChange,
  onPickLocation,
}: {
  values: AssetFormValues["location"];
  errors: FormErrors;
  disabled: boolean;
  onLocationChange: LocationChangeHandler;
  onPickLocation: () => void;
}) {
  return (
    <FormSection title="Location">
      <div className="space-y-4">
        <div className={GRID_CLASS}>
          <TextField
            id="lat"
            label="Latitude"
            value={values.lat}
            onChange={(value) => onLocationChange("lat", value)}
            error={errors["location.lat"]}
            type="number"
            placeholder="0.0"
            disabled={disabled}
          />
          <TextField
            id="lng"
            label="Longitude"
            value={values.lng}
            onChange={(value) => onLocationChange("lng", value)}
            error={errors["location.lng"]}
            type="number"
            placeholder="0.0"
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          onClick={onPickLocation}
          className="mt-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={disabled}
        >
          Pick Location
        </button>
        {(errors["location.lat"] || errors["location.lng"]) && (
          <p className="text-sm text-red-600">
            Please provide valid coordinates
          </p>
        )}
      </div>
    </FormSection>
  );
}
