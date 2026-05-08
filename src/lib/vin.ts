export type DecodedVin = {
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
}

type NhtsaResult = {
  Variable: string
  Value: string | null
}

export async function decodeVin(vin: string): Promise<DecodedVin | null> {
  const cleaned = vin.trim().toUpperCase()
  if (cleaned.length !== 17) return null

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(
        cleaned
      )}?format=json`,
      { cache: "force-cache" }
    )
    if (!res.ok) return null
    const json = (await res.json()) as { Results: NhtsaResult[] }
    if (!json?.Results) return null

    const findValue = (label: string) =>
      json.Results.find((r) => r.Variable === label)?.Value || null

    const yearRaw = findValue("Model Year")
    const year = yearRaw ? Number(yearRaw) : null

    return {
      year: Number.isFinite(year) ? year : null,
      make: findValue("Make"),
      model: findValue("Model"),
      trim: findValue("Trim") || findValue("Series"),
    }
  } catch {
    return null
  }
}
