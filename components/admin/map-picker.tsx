"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"

type MapPickerProps = {
  latitude?: string | number | null
  longitude?: string | number | null
  onChange: (coords: { latitude: string; longitude: string; label?: string }) => void
  height?: number
}

type SearchItem = { label: string; lat: number; lng: number }

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const DEFAULT_CENTER: [number, number] = [-6.9175, 107.6191] // Bandung

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14))
  }, [lat, lng, map])
  return null
}

function MapInvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const timers = [50, 200, 500].map((ms) =>
      setTimeout(() => {
        map.invalidateSize()
      }, ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [map])
  return null
}

export function MapPicker({ latitude, longitude, onChange, height = 260 }: MapPickerProps) {
  const latNum = latitude !== "" && latitude != null ? Number(latitude) : NaN
  const lngNum = longitude !== "" && longitude != null ? Number(longitude) : NaN
  const hasMarker = Number.isFinite(latNum) && Number.isFinite(lngNum)

  const center = useMemo<[number, number]>(
    () => (hasMarker ? [latNum, lngNum] : DEFAULT_CENTER),
    [hasMarker, latNum, lngNum]
  )

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchItem[]>([])
  const [searching, setSearching] = useState(false)
  const [openResults, setOpenResults] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true)
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query.trim())}`)
        const json = await res.json()
        if (json.success) {
          setResults(json.data || [])
          setOpenResults(true)
        }
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  const pick = (lat: number, lng: number, label?: string) => {
    onChange({
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
      label,
    })
    setOpenResults(false)
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <label className="text-sm font-medium block">Lokasi di Peta</label>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpenResults(true)}
              placeholder="Cari daerah / alamat (contoh: Cileunyi Bandung)..."
              className="pl-8"
            />
          </div>
          {searching && (
            <Button type="button" variant="outline" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          )}
        </div>
        {openResults && results.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-background shadow-md text-sm">
            {results.map((item, idx) => (
              <li key={`${item.lat}-${item.lng}-${idx}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted"
                  onClick={() => {
                    setQuery(item.label)
                    pick(item.lat, item.lng, item.label)
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Klik peta untuk menandai titik, atau cari daerah lalu pilih dari daftar.
      </p>
      <div className="overflow-hidden rounded-lg border border-border w-full relative z-0">
        <MapContainer
          center={center}
          zoom={hasMarker ? 14 : 11}
          scrollWheelZoom
          style={{ height, width: "100%" }}
          className="w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInvalidateSize />
          <ClickHandler onPick={(lat, lng) => pick(lat, lng)} />
          {hasMarker && (
            <>
              <Marker
                position={[latNum, lngNum]}
                icon={defaultIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const m = e.target as L.Marker
                    const pos = m.getLatLng()
                    pick(pos.lat, pos.lng)
                  },
                }}
              />
              <Recenter lat={latNum} lng={lngNum} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
