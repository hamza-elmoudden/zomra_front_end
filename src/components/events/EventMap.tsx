import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface EventMapProps {
  lat?: number | null
  lng?: number | null
  onPositionChange?: (lat: number, lng: number) => void
  readOnly?: boolean
}

function ClickHandler({
  onPositionChange,
}: {
  onPositionChange?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (onPositionChange) {
        onPositionChange(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export default function EventMap({
  lat,
  lng,
  onPositionChange,
  readOnly = false,
}: EventMapProps) {
  const center: [number, number] =
    lat && lng ? [lat, lng] : [40.7128, -74.006]

  return (
    <div className="h-64 overflow-hidden rounded-xl">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readOnly && <ClickHandler onPositionChange={onPositionChange} />}
        {lat && lng && (
          <Marker position={[lat, lng]} icon={icon} />
        )}
      </MapContainer>
    </div>
  )
}
