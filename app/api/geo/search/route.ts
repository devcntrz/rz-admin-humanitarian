import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("format", "json")
    url.searchParams.set("q", q)
    url.searchParams.set("countrycodes", "id")
    url.searchParams.set("limit", "6")
    url.searchParams.set("addressdetails", "1")

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "rz-admin-humanitarian/1.0 (admin map picker)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Geocoding service error" },
        { status: 502 }
      )
    }

    const raw = (await res.json()) as Array<{
      display_name: string
      lat: string
      lon: string
    }>

    const data = raw.map((item) => ({
      label: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Geo search error:", error)
    return NextResponse.json({ success: false, error: "Failed to search location" }, { status: 500 })
  }
}
