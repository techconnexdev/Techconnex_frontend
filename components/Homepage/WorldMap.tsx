"use client";
import WorldMap from "@/components/ui/world-map";

export function WorldMapDemo() {
  return (
    <div className="py-16 md:py-60 dark:bg-black bg-white w-full">
      <h2 className="text-5xl md:text-6xl font-medium text-center tracking-tighter">
      Tech for the Process. Connect for the Purpose.
        </h2>
        <p className="text-gray-950 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
        Transcending borders to link ambition with opportunity, no matter where you are on the map.        </p>
      <div className="max-w-5xl mx-auto mt-8 md:mt-12">
        <WorldMap
          dots={[
            {
              start: {
                lat: 64.2008,
                lng: -149.4937,
              }, // Alaska (Fairbanks)
              end: {
                lat: 34.0522,
                lng: -118.2437,
              }, // Los Angeles
            },
            {
              start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
              end: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
            },
            {
              start: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
              end: { lat: 38.7223, lng: -9.1393 }, // Lisbon
            },
            {
              start: { lat: 51.5074, lng: -0.1278 }, // London
              end: { lat: -18, lng: 104.209 }, // KL
            },
            {
              start: { lat: -18, lng: 104.209 }, // KL
              end: { lat: 3.6139, lng: 49.209 }, // Sanaa
            },
            {
              start: { lat: -18, lng: 104.209 }, // KL
              end: { lat: 10.2921, lng: 26.8219 }, // Cairo
            },
            {
                start: { lat: 3.6139, lng: 49.209 }, // Sanaa
                end: { lat: 10.2921, lng: 26.8219 }, // Cairo
            },
          ]}
        />
      </div>
    </div>
  );
}
