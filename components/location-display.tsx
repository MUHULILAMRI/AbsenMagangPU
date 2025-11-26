import { MapPin } from "lucide-react"

interface LocationDisplayProps {
  location: { latitude: number; longitude: number }
}

export default function LocationDisplay({ location }: LocationDisplayProps) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-blue-900">
        <p className="font-medium mb-1">Lokasi Terdeteksi</p>
        <p className="text-xs text-blue-700">
          Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
        </p>
        <p className="text-xs text-blue-600 mt-2">
          <a
            href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-800"
          >
            Buka di Google Maps
          </a>
        </p>
      </div>
    </div>
  )
}
