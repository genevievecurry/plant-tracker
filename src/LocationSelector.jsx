import { useState } from "react";
import { Locate, Map } from "lucide-react";

function LocationSelector({ onLocationSelected }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for coordinate-based selection
  const [selectionMethod, setSelectionMethod] = useState("place"); // "place" or "coordinates"
  const [coordinates, setCoordinates] = useState({
    lat: "",
    lng: "",
    radius: 10, // Default radius in km
  });
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  // Search places by name
  const searchPlaces = async () => {
    if (!searchTerm) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.inaturalist.org/v1/places/autocomplete?q=${searchTerm}`
      );
      const data = await response.json();
      setPlaces(data.results);
    } catch (err) {
      console.error("Error searching places:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle selection of a place from search results
  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setSelectionMethod("place");
    onLocationSelected({
      type: "place",
      id: place.id,
      name: place.display_name,
    });
  };

  // Handle coordinate-based selection
  const handleCoordinateSelection = () => {
    if (!coordinates.lat || !coordinates.lng) {
      alert("Please enter both latitude and longitude");
      return;
    }

    const location = {
      type: "coordinates",
      lat: parseFloat(coordinates.lat),
      lng: parseFloat(coordinates.lng),
      radius: parseInt(coordinates.radius, 10),
    };

    setSelectedPlace(null); // Clear any selected place
    setSelectionMethod("coordinates");
    onLocationSelected(location);
  };

  // Update coordinates when radius changes
  const handleRadiusChange = (e) => {
    const newRadius = e.target.value;
    setCoordinates({ ...coordinates, radius: newRadius });
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setUsingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoordinates = {
          ...coordinates,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        };

        setCoordinates(newCoordinates);
        setUsingCurrentLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(`Error getting your location: ${error.message}`);
        setUsingCurrentLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Select Location</h2>

      {/* Selection Method Tabs */}
      <div className="border-b border-gray-200">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          <button
            className={`group inline-flex items-center border-b-2 px-1 py-2 text-sm font-medium ${
              selectionMethod === "place"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setSelectionMethod("place")}
          >
            <Map
              className={`mr-2 -ml-0.5 size-5 ${
                selectionMethod === "coordinates"
                  ? "text-gray-400 group-hover:text-gray-700"
                  : "  text-emerald-600 group-hover:text-emerald-800 "
              }`}
            />
            <span>Search by Place</span>
          </button>
          <button
            className={`group inline-flex items-center border-b-2 px-1 py-2 text-sm font-medium ${
              selectionMethod === "coordinates"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setSelectionMethod("coordinates")}
          >
            <Locate
              className={`mr-2 -ml-0.5 size-5 ${
                selectionMethod === "coordinates"
                  ? "text-emerald-600"
                  : " text-gray-400 group-hover:text-gray-700"
              }`}
            />
            <span>Use Coordinates</span>
          </button>
        </nav>
      </div>

      {/* Place Search */}
      {selectionMethod === "place" && (
        <div>
          <div className="mb-4">
            <label className="text-xs uppercase">Search Places</label>
            <div className="flex mt-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full appearance-none rounded-sm py-1 px-3 text-base text-stone-900 outline -outline-offset-1 outline-stone-900 focus:outline focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                placeholder="City, park, county, etc."
              />
              <button
                onClick={searchPlaces}
                className="ml-3 inline-flex items-center px-4 py-2 bg-stone-600 text-white hover:bg-stone-500"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {places.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Select a place:
              </h3>
              <div className="max-h-60 overflow-y-auto border rounded-sm">
                {places.map((place) => (
                  <div
                    key={place.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                      selectedPlace?.id === place.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => handleSelectPlace(place)}
                  >
                    <p className="font-medium">{place.display_name}</p>
                    <p className="text-xs text-gray-500">
                      {place.place_type === 0
                        ? "Country"
                        : place.place_type === 10
                        ? "State"
                        : place.place_type === 20
                        ? "County"
                        : place.place_type === 30
                        ? "Town"
                        : place.place_type === 100
                        ? "Park"
                        : "Place"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPlace && (
            <div className="mt-4 p-3 bg-gray-50 rounded-sm">
              <p className="text-sm">
                Selected: <strong>{selectedPlace.display_name}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Coordinate Selection */}
      {selectionMethod === "coordinates" && (
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center pt-4">
              <label className="block text-sm font-medium text-gray-700">
                Geographic Coordinates
              </label>
              <button
                onClick={getCurrentLocation}
                className="text-sm text-emerald-600 hover:text-emerald-800"
                disabled={usingCurrentLocation}
              >
                {usingCurrentLocation
                  ? "Getting location..."
                  : "Use my current location"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-xs uppercase">Latitude:</label>
                <input
                  type="text"
                  value={coordinates.lat}
                  onChange={(e) =>
                    setCoordinates({ ...coordinates, lat: e.target.value })
                  }
                  className="w-full appearance-none rounded-sm py-1 px-3 text-base text-stone-900 outline -outline-offset-1 outline-stone-900 focus:outline focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                  placeholder="e.g., 45.523064"
                />
              </div>
              <div>
                <label className="text-xs uppercase">Longitude:</label>
                <input
                  type="text"
                  value={coordinates.lng}
                  onChange={(e) =>
                    setCoordinates({ ...coordinates, lng: e.target.value })
                  }
                  className="w-full appearance-none rounded-sm py-1 px-3 text-base text-stone-900 outline -outline-offset-1 outline-stone-900 focus:outline focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                  placeholder="e.g., -122.676483"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Search Radius (km)
            </label>
            <div className="flex items-center mt-1">
              <input
                type="range"
                min="1"
                max="50"
                value={coordinates.radius}
                onChange={handleRadiusChange}
                className="w-full mr-3"
              />
              <input
                type="number"
                min="1"
                max="50"
                value={coordinates.radius}
                onChange={handleRadiusChange}
                className="w-16 rounded-sm border-gray-300 px-2 py-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will search for observations within {coordinates.radius} km
              of the specified coordinates.
            </p>
          </div>

          <button
            onClick={handleCoordinateSelection}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-500"
          >
            Use These Coordinates
          </button>

          {selectionMethod === "coordinates" &&
            coordinates.lat &&
            coordinates.lng && (
              <div className="mt-4 p-3 bg-gray-50 rounded-sm">
                <p className="text-sm">
                  Selected area: <strong>{coordinates.radius} km</strong> radius
                  around
                  <strong>
                    {" "}
                    {coordinates.lat}, {coordinates.lng}
                  </strong>
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
