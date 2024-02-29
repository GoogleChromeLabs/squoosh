// Based on https://www.npmjs.com/package/pretty-bytes
// Modified so the units are returned separately.

const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

interface PrettyBytesResult {
  value: string;
  unit: string;
}

export default function prettyBytes(number: number): PrettyBytesResult {
  const isNegative = number < 0;
  const prefix = isNegative ? '-' : '';

  if (isNegative) number = -number;
  if (number < 1) return { value: prefix + number, unit: UNITS[0] };

  const exponent = Math.min(
    Math.floor(Math.log10(number) / 3),
    UNITS.length - 1,
  );

  return {
    unit: UNITS[exponent],
    value: prefix + (number / Math.pow(1000, exponent)).toPrecision(3),
  };
}
