"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { memo } from "react"

type MapPreviewProps = {
  latitude: number
  longitude: number
  height?: number | string
  zoom?: number
  label?: string
}

// Use CDN images to avoid Next bundling issues with Leaflet default icons
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapPreviewComponent({ latitude, longitude, height = 320, zoom = 9, label }: MapPreviewProps) {
  const position: [number, number] = [latitude, longitude]
  return (
    <div className="overflow-hidden rounded-lg border border-border w-full">
      <MapContainer 
        center={position} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height, width: "100%", minWidth: "100%" }}
        className="w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={defaultIcon}>
          {label ? <Popup>{label}</Popup> : null}
        </Marker>
      </MapContainer>
    </div>
  )
}

export const MapPreview = memo(MapPreviewComponent)


