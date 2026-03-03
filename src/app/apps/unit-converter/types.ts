export interface Unit {
  id: string;
  label: string;
  symbol: string;
  /** Multiply by this to convert TO the base unit */
  toBase: number | ((v: number) => number);
  /** Multiply by this to convert FROM the base unit */
  fromBase: number | ((v: number) => number);
}

export interface Category {
  id: string;
  label: string;
  icon: string;          // emoji
  baseUnit: string;      // id of the base unit
  units: Unit[];
}

/* ── Helper ───────────────────────────────────────────────────── */
export function toBase(value: number, unit: Unit): number {
  return typeof unit.toBase === "function" ? unit.toBase(value) : value * unit.toBase;
}
export function fromBase(value: number, unit: Unit): number {
  return typeof unit.fromBase === "function" ? unit.fromBase(value) : value * unit.fromBase;
}
export function convert(value: number, from: Unit, to: Unit): number {
  return fromBase(toBase(value, from), to);
}

/* ══════════════════════════════════════════════════════════════
   CATEGORIES
══════════════════════════════════════════════════════════════ */

export const CATEGORIES: Category[] = [

  /* LENGTH — base: metre */
  {
    id: "length", label: "Length", icon: "📏", baseUnit: "m",
    units: [
      { id: "pm",  label: "Picometre",      symbol: "pm",  toBase: 1e-12,        fromBase: 1e12          },
      { id: "nm",  label: "Nanometre",      symbol: "nm",  toBase: 1e-9,         fromBase: 1e9           },
      { id: "um",  label: "Micrometre",     symbol: "μm",  toBase: 1e-6,         fromBase: 1e6           },
      { id: "mm",  label: "Millimetre",     symbol: "mm",  toBase: 0.001,        fromBase: 1000          },
      { id: "cm",  label: "Centimetre",     symbol: "cm",  toBase: 0.01,         fromBase: 100           },
      { id: "m",   label: "Metre",          symbol: "m",   toBase: 1,            fromBase: 1             },
      { id: "km",  label: "Kilometre",      symbol: "km",  toBase: 1000,         fromBase: 0.001         },
      { id: "in",  label: "Inch",           symbol: "in",  toBase: 0.0254,       fromBase: 39.3701       },
      { id: "ft",  label: "Foot",           symbol: "ft",  toBase: 0.3048,       fromBase: 3.28084       },
      { id: "yd",  label: "Yard",           symbol: "yd",  toBase: 0.9144,       fromBase: 1.09361       },
      { id: "mi",  label: "Mile",           symbol: "mi",  toBase: 1609.344,     fromBase: 0.000621371   },
      { id: "nmi", label: "Nautical Mile",  symbol: "nmi", toBase: 1852,         fromBase: 0.000539957   },
      { id: "ly",  label: "Light Year",     symbol: "ly",  toBase: 9.461e15,     fromBase: 1 / 9.461e15  },
    ],
  },

  /* WEIGHT — base: kilogram */
  {
    id: "weight", label: "Weight / Mass", icon: "⚖️", baseUnit: "kg",
    units: [
      { id: "mg",    label: "Milligram",  symbol: "mg",  toBase: 1e-6,        fromBase: 1e6           },
      { id: "g",     label: "Gram",       symbol: "g",   toBase: 0.001,       fromBase: 1000          },
      { id: "kg",    label: "Kilogram",   symbol: "kg",  toBase: 1,           fromBase: 1             },
      { id: "t",     label: "Metric Ton", symbol: "t",   toBase: 1000,        fromBase: 0.001         },
      { id: "oz",    label: "Ounce",      symbol: "oz",  toBase: 0.0283495,   fromBase: 35.274        },
      { id: "lb",    label: "Pound",      symbol: "lb",  toBase: 0.453592,    fromBase: 2.20462       },
      { id: "st",    label: "Stone",      symbol: "st",  toBase: 6.35029,     fromBase: 0.157473      },
      { id: "uston", label: "US Ton",     symbol: "ton", toBase: 907.185,     fromBase: 0.00110231    },
    ],
  },

  /* TEMPERATURE — base: Kelvin (special functions) */
  {
    id: "temperature", label: "Temperature", icon: "🌡️", baseUnit: "K",
    units: [
      {
        id: "C", label: "Celsius",    symbol: "°C",
        toBase: (v) => v + 273.15,   fromBase: (v) => v - 273.15,
      },
      {
        id: "F", label: "Fahrenheit", symbol: "°F",
        toBase: (v) => (v - 32) * 5 / 9 + 273.15,
        fromBase: (v) => (v - 273.15) * 9 / 5 + 32,
      },
      {
        id: "K", label: "Kelvin",     symbol: "K",
        toBase: 1, fromBase: 1,
      },
      {
        id: "R", label: "Rankine",    symbol: "°R",
        toBase: (v) => v * 5 / 9,    fromBase: (v) => v * 9 / 5,
      },
    ],
  },

  /* AREA — base: m² */
  {
    id: "area", label: "Area", icon: "🔲", baseUnit: "m2",
    units: [
      { id: "mm2",  label: "Square Millimetre", symbol: "mm²",   toBase: 1e-6,        fromBase: 1e6          },
      { id: "cm2",  label: "Square Centimetre", symbol: "cm²",   toBase: 1e-4,        fromBase: 1e4          },
      { id: "m2",   label: "Square Metre",      symbol: "m²",    toBase: 1,           fromBase: 1            },
      { id: "km2",  label: "Square Kilometre",  symbol: "km²",   toBase: 1e6,         fromBase: 1e-6         },
      { id: "ha",   label: "Hectare",           symbol: "ha",    toBase: 10000,       fromBase: 0.0001       },
      { id: "acre", label: "Acre",              symbol: "acre",  toBase: 4046.86,     fromBase: 0.000247105  },
      { id: "in2",  label: "Square Inch",       symbol: "in²",   toBase: 0.00064516,  fromBase: 1550.0031    },
      { id: "ft2",  label: "Square Foot",       symbol: "ft²",   toBase: 0.092903,    fromBase: 10.7639      },
      { id: "yd2",  label: "Square Yard",       symbol: "yd²",   toBase: 0.836127,    fromBase: 1.19599      },
      { id: "mi2",  label: "Square Mile",       symbol: "mi²",   toBase: 2.58999e6,   fromBase: 3.861e-7     },
    ],
  },

  /* VOLUME — base: litre */
  {
    id: "volume", label: "Volume", icon: "🧪", baseUnit: "L",
    units: [
      { id: "ml",    label: "Millilitre",    symbol: "mL",   toBase: 0.001,       fromBase: 1000         },
      { id: "L",     label: "Litre",         symbol: "L",    toBase: 1,           fromBase: 1            },
      { id: "m3",    label: "Cubic Metre",   symbol: "m³",   toBase: 1000,        fromBase: 0.001        },
      { id: "cm3",   label: "Cubic Cm",      symbol: "cm³",  toBase: 0.001,       fromBase: 1000         },
      { id: "tsp",   label: "Teaspoon (US)", symbol: "tsp",  toBase: 0.00492892,  fromBase: 202.884      },
      { id: "tbsp",  label: "Tablespoon",    symbol: "tbsp", toBase: 0.0147868,   fromBase: 67.628       },
      { id: "floz",  label: "Fl Oz (US)",    symbol: "fl oz",toBase: 0.0295735,   fromBase: 33.814       },
      { id: "cup",   label: "Cup (US)",      symbol: "cup",  toBase: 0.236588,    fromBase: 4.22675      },
      { id: "pt",    label: "Pint (US)",     symbol: "pt",   toBase: 0.473176,    fromBase: 2.11338      },
      { id: "qt",    label: "Quart (US)",    symbol: "qt",   toBase: 0.946353,    fromBase: 1.05669      },
      { id: "gal",   label: "Gallon (US)",   symbol: "gal",  toBase: 3.78541,     fromBase: 0.264172     },
      { id: "gal_uk",label: "Gallon (UK)",   symbol: "gal UK",toBase: 4.54609,    fromBase: 0.219969     },
    ],
  },

  /* SPEED — base: m/s */
  {
    id: "speed", label: "Speed", icon: "💨", baseUnit: "ms",
    units: [
      { id: "ms",   label: "Metres/Second",   symbol: "m/s",   toBase: 1,           fromBase: 1           },
      { id: "kmh",  label: "Kilometres/Hour", symbol: "km/h",  toBase: 1 / 3.6,     fromBase: 3.6         },
      { id: "mph",  label: "Miles/Hour",      symbol: "mph",   toBase: 0.44704,     fromBase: 2.23694     },
      { id: "knot", label: "Knot",            symbol: "kn",    toBase: 0.514444,    fromBase: 1.94384     },
      { id: "fts",  label: "Feet/Second",     symbol: "ft/s",  toBase: 0.3048,      fromBase: 3.28084     },
      { id: "mach", label: "Mach",            symbol: "M",     toBase: 340.29,      fromBase: 1 / 340.29  },
    ],
  },

  /* TIME — base: second */
  {
    id: "time", label: "Time", icon: "⏱️", baseUnit: "s",
    units: [
      { id: "ns",  label: "Nanosecond",  symbol: "ns",  toBase: 1e-9,        fromBase: 1e9          },
      { id: "us",  label: "Microsecond", symbol: "μs",  toBase: 1e-6,        fromBase: 1e6          },
      { id: "ms",  label: "Millisecond", symbol: "ms",  toBase: 0.001,       fromBase: 1000         },
      { id: "s",   label: "Second",      symbol: "s",   toBase: 1,           fromBase: 1            },
      { id: "min", label: "Minute",      symbol: "min", toBase: 60,          fromBase: 1 / 60       },
      { id: "h",   label: "Hour",        symbol: "h",   toBase: 3600,        fromBase: 1 / 3600     },
      { id: "d",   label: "Day",         symbol: "d",   toBase: 86400,       fromBase: 1 / 86400    },
      { id: "wk",  label: "Week",        symbol: "wk",  toBase: 604800,      fromBase: 1 / 604800   },
      { id: "mo",  label: "Month (avg)", symbol: "mo",  toBase: 2629746,     fromBase: 1 / 2629746  },
      { id: "yr",  label: "Year",        symbol: "yr",  toBase: 31556952,    fromBase: 1 / 31556952 },
    ],
  },

  /* DIGITAL STORAGE — base: byte */
  {
    id: "data", label: "Digital Storage", icon: "💾", baseUnit: "byte",
    units: [
      { id: "bit",  label: "Bit",       symbol: "bit", toBase: 0.125,       fromBase: 8            },
      { id: "byte", label: "Byte",      symbol: "B",   toBase: 1,           fromBase: 1            },
      { id: "kb",   label: "Kilobyte",  symbol: "KB",  toBase: 1024,        fromBase: 1 / 1024     },
      { id: "mb",   label: "Megabyte",  symbol: "MB",  toBase: 1048576,     fromBase: 1 / 1048576  },
      { id: "gb",   label: "Gigabyte",  symbol: "GB",  toBase: 1073741824,  fromBase: 1 / 1073741824 },
      { id: "tb",   label: "Terabyte",  symbol: "TB",  toBase: 1.0995e12,   fromBase: 1 / 1.0995e12 },
      { id: "pb",   label: "Petabyte",  symbol: "PB",  toBase: 1.1259e15,   fromBase: 1 / 1.1259e15 },
      { id: "kib",  label: "Kibibyte",  symbol: "KiB", toBase: 1024,        fromBase: 1 / 1024     },
      { id: "mib",  label: "Mebibyte",  symbol: "MiB", toBase: 1048576,     fromBase: 1 / 1048576  },
      { id: "gib",  label: "Gibibyte",  symbol: "GiB", toBase: 1073741824,  fromBase: 1 / 1073741824 },
    ],
  },

  /* PRESSURE — base: Pascal */
  {
    id: "pressure", label: "Pressure", icon: "🔵", baseUnit: "pa",
    units: [
      { id: "pa",   label: "Pascal",      symbol: "Pa",   toBase: 1,           fromBase: 1           },
      { id: "kpa",  label: "Kilopascal",  symbol: "kPa",  toBase: 1000,        fromBase: 0.001       },
      { id: "mpa",  label: "Megapascal",  symbol: "MPa",  toBase: 1e6,         fromBase: 1e-6        },
      { id: "bar",  label: "Bar",         symbol: "bar",  toBase: 100000,      fromBase: 1e-5        },
      { id: "atm",  label: "Atmosphere",  symbol: "atm",  toBase: 101325,      fromBase: 9.8692e-6   },
      { id: "psi",  label: "PSI",         symbol: "psi",  toBase: 6894.76,     fromBase: 0.000145038 },
      { id: "mmhg", label: "mmHg (Torr)", symbol: "mmHg", toBase: 133.322,     fromBase: 0.00750062  },
    ],
  },

  /* ENERGY — base: Joule */
  {
    id: "energy", label: "Energy", icon: "⚡", baseUnit: "J",
    units: [
      { id: "J",    label: "Joule",       symbol: "J",    toBase: 1,           fromBase: 1           },
      { id: "kJ",   label: "Kilojoule",   symbol: "kJ",   toBase: 1000,        fromBase: 0.001       },
      { id: "MJ",   label: "Megajoule",   symbol: "MJ",   toBase: 1e6,         fromBase: 1e-6        },
      { id: "cal",  label: "Calorie",     symbol: "cal",  toBase: 4.184,       fromBase: 0.239006    },
      { id: "kcal", label: "Kilocalorie", symbol: "kcal", toBase: 4184,        fromBase: 0.000239006 },
      { id: "Wh",   label: "Watt-hour",   symbol: "Wh",   toBase: 3600,        fromBase: 1 / 3600    },
      { id: "kWh",  label: "Kilowatt-hr", symbol: "kWh",  toBase: 3600000,     fromBase: 1 / 3600000 },
      { id: "BTU",  label: "BTU",         symbol: "BTU",  toBase: 1055.06,     fromBase: 0.000947817 },
      { id: "eV",   label: "Electronvolt",symbol: "eV",   toBase: 1.60218e-19, fromBase: 6.242e18    },
    ],
  },

  /* POWER — base: Watt */
  {
    id: "power", label: "Power", icon: "🔋", baseUnit: "W",
    units: [
      { id: "W",    label: "Watt",        symbol: "W",    toBase: 1,           fromBase: 1           },
      { id: "kW",   label: "Kilowatt",    symbol: "kW",   toBase: 1000,        fromBase: 0.001       },
      { id: "MW",   label: "Megawatt",    symbol: "MW",   toBase: 1e6,         fromBase: 1e-6        },
      { id: "hp",   label: "Horsepower",  symbol: "hp",   toBase: 745.7,       fromBase: 0.00134102  },
      { id: "BTUh", label: "BTU/hour",    symbol: "BTU/h",toBase: 0.293071,    fromBase: 3.41214     },
    ],
  },

  /* ANGLE — base: degree */
  {
    id: "angle", label: "Angle", icon: "📐", baseUnit: "deg",
    units: [
      { id: "deg",  label: "Degree",   symbol: "°",    toBase: 1,           fromBase: 1                  },
      { id: "rad",  label: "Radian",   symbol: "rad",  toBase: 180 / Math.PI, fromBase: Math.PI / 180   },
      { id: "grad", label: "Gradian",  symbol: "grad", toBase: 0.9,         fromBase: 10 / 9             },
      { id: "turn", label: "Turn",     symbol: "turn", toBase: 360,         fromBase: 1 / 360            },
      { id: "arcmin",label:"Arc Minute",symbol: "′",   toBase: 1 / 60,      fromBase: 60                 },
      { id: "arcsec",label:"Arc Second",symbol: "″",   toBase: 1 / 3600,    fromBase: 3600               },
    ],
  },

  /* FUEL ECONOMY — base: km/L */
  {
    id: "fuel", label: "Fuel Economy", icon: "⛽", baseUnit: "kmL",
    units: [
      { id: "kmL",    label: "km/L",      symbol: "km/L",     toBase: 1,           fromBase: 1            },
      { id: "mpgus",  label: "MPG (US)",  symbol: "mpg",      toBase: 0.425144,    fromBase: 2.35215      },
      { id: "mpguk",  label: "MPG (UK)",  symbol: "mpg (UK)", toBase: 0.354006,    fromBase: 2.82481      },
      {
        id: "l100km",
        label: "L/100km",
        symbol: "L/100km",
        toBase: (v) => v === 0 ? 0 : 100 / v,
        fromBase: (v) => v === 0 ? 0 : 100 / v,
      },
    ],
  },

  /* DATA TRANSFER — base: bits/s */
  {
    id: "datatransfer", label: "Data Transfer", icon: "📡", baseUnit: "bps",
    units: [
      { id: "bps",  label: "Bits/sec",       symbol: "bps",  toBase: 1,        fromBase: 1        },
      { id: "Kbps", label: "Kilobits/sec",   symbol: "Kbps", toBase: 1e3,      fromBase: 1e-3     },
      { id: "Mbps", label: "Megabits/sec",   symbol: "Mbps", toBase: 1e6,      fromBase: 1e-6     },
      { id: "Gbps", label: "Gigabits/sec",   symbol: "Gbps", toBase: 1e9,      fromBase: 1e-9     },
      { id: "KBps", label: "Kilobytes/sec",  symbol: "KB/s", toBase: 8e3,      fromBase: 1 / 8e3  },
      { id: "MBps", label: "Megabytes/sec",  symbol: "MB/s", toBase: 8e6,      fromBase: 1 / 8e6  },
      { id: "GBps", label: "Gigabytes/sec",  symbol: "GB/s", toBase: 8e9,      fromBase: 1 / 8e9  },
    ],
  },
];

/* ── Quick lookup ─────────────────────────────────────────────── */
export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export function getUnit(categoryId: string, unitId: string): Unit | undefined {
  return CATEGORY_MAP[categoryId]?.units.find((u) => u.id === unitId);
}

/* ── Format result ────────────────────────────────────────────── */
export function formatResult(value: number): string {
  if (!isFinite(value)) return "∞";
  if (isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e15 || (abs < 1e-9 && abs > 0)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  // Up to 10 significant digits, trim trailing zeros
  const str = value.toPrecision(10);
  // Remove trailing zeros after decimal
  if (str.includes(".")) {
    return str.replace(/\.?0+$/, "");
  }
  return str;
}
