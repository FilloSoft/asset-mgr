import { HttpError } from './errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertUuid(id: string, entityLabel = 'resource'): string {
  if (!UUID_REGEX.test(id)) {
    throw new HttpError(400, `Invalid ${entityLabel} ID format`);
  }

  return id;
}

export function parseUuidList(idsParam: string | null) {
  if (!idsParam) {
    return { ids: [] as string[], invalid: [] as string[] };
  }

  const ids = idsParam
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const invalid = ids.filter((value) => !UUID_REGEX.test(value));

  return { ids, invalid };
}

export function requireUuidList(
  idsParam: string | null,
  entityLabel: string,
): string[] {
  const { ids, invalid } = parseUuidList(idsParam);

  if (ids.length === 0) {
    throw new HttpError(400, `${entityLabel} IDs are required`);
  }

  if (invalid.length > 0) {
    throw new HttpError(400, `Invalid ${entityLabel} IDs provided`);
  }

  return ids;
}

export function requireNonEmptyPayload<T extends object>(
  payload: T | null | undefined,
  message: string,
): T {
  if (!payload || Object.keys(payload).length === 0) {
    throw new HttpError(400, message);
  }

  return payload;
}
