"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Fuel,
  MapPin,
  ChevronLeft,
  Loader2,
  Info,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  Shield,
  Globe,
} from "lucide-react";
import { FUEL_DATA, findState, findCity, DATA_DATE, type StateData, type CityPrice } from "../data/fuelData";

type LocationStatus = "idle" | "detecting" | "found" | "error" | "denied";

export default function FuelPricesClient() {
  const [selectedState, setSelectedState] = useState<StateData>(FUEL_DATA[0]); // Kerala
  const [selectedCity, setSelectedCity] = useState<CityPrice>(FUEL_DATA[0].cities[0]); // Ernakulam

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMethod, setLocationMethod] = useState<"ip" | "default" | null>(null);
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);
  const [showAllStates, setShowAllStates] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState("");

  // Sorted states for dropdown
  const sortedStates = useMemo(
    () => [...FUEL_DATA].sort((a, b) => a.state.localeCompare(b.state)),
    []
  );

  // All-India comparison sorted by petrol price desc
  const allStatesSummary = useMemo(
    () =>
      FUEL_DATA.map((s) => ({
        state: s.state,
        slug: s.slug,
        petrol: s.cities[0].petrol,
        diesel: s.cities[0].diesel,
        capital: s.capital,
      })).sort((a, b) => b.petrol - a.petrol),
    []
  );

  // Detect location via IP (privacy-preserving: we proxy through our own API)
  async function detectLocation() {
    setLocationStatus("detecting");
    try {
      const res = await fetch("/api/fuel-location");
      const data = await res.json() as { state: string; city: string; method: "ip" | "default" };

      const matchedState = findState(data.state);
      if (!matchedState) {
        setLocationStatus("error");
        return;
      }
      const matchedCity =
        findCity(matchedState, data.city) ?? matchedState.cities[0];

      setSelectedState(matchedState);
      setSelectedCity(matchedCity);
      setLocationMethod(data.method);
      setDetectedLabel(`${matchedCity.city}, ${matchedState.state}`);
      setLocationStatus("found");
    } catch {
      setLocationStatus("error");
    }
  }

  function handleStateChange(slug: string) {
    const state = FUEL_DATA.find((s) => s.slug === slug)!;
    setSelectedState(state);
    setSelectedCity(state.cities[0]);
    setLocationStatus("idle");
  }

  function handleCityChange(cityName: string) {
    const city = selectedState.cities.find((c) => c.city === cityName)!;
    setSelectedCity(city);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Link
            href="/#apps"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-border/60">|</span>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Fuel className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">Fuel Prices India</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 text-xs font-medium text-orange-500 mb-2">
            <Fuel className="h-3 w-3" />
            Daily Fuel Prices
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Petrol &amp; Diesel Prices
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            Today&apos;s fuel prices for all Indian states and cities.
          </p>
        </div>

        {/* Location Detection Card */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Find prices for your location</p>
                <p className="text-xs text-muted mt-0.5 max-w-sm">
                  Uses your internet connection&rsquo;s approximate location — no GPS, no
                  personal data collected or stored.{" "}
                  <button
                    onClick={() => setShowPrivacyNote((v) => !v)}
                    className="text-blue-500 hover:underline"
                  >
                    How does this work?
                  </button>
                </p>
              </div>
            </div>
            <button
              onClick={detectLocation}
              disabled={locationStatus === "detecting"}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {locationStatus === "detecting" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              {locationStatus === "detecting" ? "Detecting…" : "Detect my location"}
            </button>
          </div>

          {/* Privacy explanation panel */}
          {showPrivacyNote && (
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 text-xs text-muted space-y-2">
              <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm">
                <Shield className="h-4 w-4" />
                How we detect your location — honestly
              </div>
              <p>
                When you click &ldquo;Detect my location&rdquo;, we look up which city corresponds
                to your device&rsquo;s <strong className="text-foreground">IP address</strong>
                — the same number your internet provider assigns to your router.
                This is called <em>IP geolocation</em> and is accurate to city-level.
              </p>
              <p>
                <strong className="text-foreground">What we do NOT do:</strong> We do not use
                GPS, device sensors, your account, cookies, or any personal identifiers.
                The IP lookup happens on our server — it is <strong className="text-foreground">never</strong> sent to
                any third-party analytics service. We only return the city and state name
                to your browser. Nothing is saved. Nothing is logged.
              </p>
              <p>
                If the location is wrong (VPN, shared IP, etc.) you can always select
                your state and city manually below.
              </p>
              <button
                onClick={() => setShowPrivacyNote(false)}
                className="text-blue-500 hover:underline"
              >
                Got it, close
              </button>
            </div>
          )}

          {/* Detection result */}
          {locationStatus === "found" && (
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Location detected:{" "}
              <span className="font-semibold">{detectedLabel}</span>
              {locationMethod === "ip" && (
                <span className="text-muted">(via IP address)</span>
              )}
            </div>
          )}
          {locationStatus === "error" && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              Could not detect location. Please select manually below.
            </div>
          )}
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              State / UT
            </label>
            <div className="relative">
              <select
                value={selectedState.slug}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border/40 bg-card px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
              >
                {sortedStates.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.state}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              City / District
            </label>
            <div className="relative">
              <select
                value={selectedCity.city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border/40 bg-card px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
              >
                {selectedState.cities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                    {c.aliases ? ` / ${c.aliases[0]}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            </div>
          </div>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Petrol */}
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/5 p-6 space-y-2 relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                Petrol
              </span>
              <div className="h-7 w-7 rounded-full bg-orange-500/15 flex items-center justify-center">
                <Fuel className="h-3.5 w-3.5 text-orange-500" />
              </div>
            </div>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight">
              ₹{selectedCity.petrol.toFixed(2)}
            </p>
            <p className="text-xs text-muted">per litre</p>
            <p className="text-xs text-orange-500/80 font-medium">
              {selectedCity.city}, {selectedState.state}
            </p>
          </div>

          {/* Diesel */}
          <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-blue-500/5 p-6 space-y-2 relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-500">
                Diesel
              </span>
              <div className="h-7 w-7 rounded-full bg-sky-500/15 flex items-center justify-center">
                <Fuel className="h-3.5 w-3.5 text-sky-500" />
              </div>
            </div>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight">
              ₹{selectedCity.diesel.toFixed(2)}
            </p>
            <p className="text-xs text-muted">per litre</p>
            <p className="text-xs text-sky-500/80 font-medium">
              {selectedCity.city}, {selectedState.state}
            </p>
          </div>
        </div>

        {/* Quick insight */}
        <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-4 text-sm flex items-center gap-3">
          <Info className="h-4 w-4 text-muted shrink-0 mt-0.5" />
          <p className="text-muted">
            Petrol is{" "}
            <span className="text-foreground font-semibold">
              ₹{Math.abs(selectedCity.petrol - selectedCity.diesel).toFixed(2)}
            </span>{" "}
            {selectedCity.petrol > selectedCity.diesel ? "more expensive than" : "cheaper than"}{" "}
            diesel in {selectedCity.city}.
            Prices include central excise + state VAT + dealer commission.
            Rounded to the paise (₹0.01).
          </p>
        </div>

        {/* Data note */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3.5 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Prices are indicative.</span>{" "}
            Data is synced periodically and was last updated on <strong className="text-foreground">{DATA_DATE}</strong>.
            Actual prices at your nearest pump may vary slightly due to dealer levies and rounding.
            For the exact price, check your city on{" "}
            <a
              href="https://www.iocl.com/retail-selling-price"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              iocl.com
            </a>
            {" "}or{" "}
            <a
              href="https://mypetrolprice.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              mypetrolprice.com
            </a>
            .
          </p>
        </div>

        {/* All-India comparison table */}
        <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
          <button
            onClick={() => setShowAllStates((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted" />
              <span className="font-semibold text-sm">All-India Price Comparison</span>
              <span className="text-xs text-muted rounded-full bg-border/40 px-2 py-0.5">
                {FUEL_DATA.length} states/UTs
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted transition-transform ${showAllStates ? "rotate-180" : ""}`}
            />
          </button>

          {showAllStates && (
            <div className="overflow-x-auto border-t border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-black/10">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">
                      State / UT
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">
                      City
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-orange-500 uppercase tracking-wide">
                      Petrol
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-sky-500 uppercase tracking-wide">
                      Diesel
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allStatesSummary.map((row, i) => (
                    <tr
                      key={row.slug}
                      className={`border-b border-border/20 hover:bg-white/5 transition-colors cursor-pointer ${
                        row.slug === selectedState.slug ? "bg-orange-500/5" : ""
                      }`}
                      onClick={() => handleStateChange(row.slug)}
                    >
                      <td className="px-4 py-2.5 font-medium">
                        <span className="flex items-center gap-2">
                          {row.state}
                          {row.slug === selectedState.slug && (
                            <span className="text-[10px] bg-orange-500/20 text-orange-500 rounded px-1.5 py-0.5 font-semibold">
                              selected
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted text-xs">{row.capital}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-orange-500">
                        ₹{row.petrol.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-sky-500">
                        ₹{row.diesel.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted pb-4">
          Fuel prices are revised by oil companies based on international crude rates.
          Prices are inclusive of all taxes.{" "}
          <span className="text-foreground/50">Data refreshed: {DATA_DATE}</span>
        </p>
      </main>
    </div>
  );
}
