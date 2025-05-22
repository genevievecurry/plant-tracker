import { useState, useEffect } from "react";
import pdxPlants from "./pdx-plants.json";
import { Search } from "lucide-react";

function ImportObservations({
  username,
  coordinates,
  placeId,
  onImportComplete,
}) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedObservations, setSelectedObservations] = useState({});
  const [importStatus, setImportStatus] = useState(null);
  const [lastFetchParams, setLastFetchParams] = useState(null);
  const [observationSearchTerm, setObservationSearchTerm] = useState("");

  const fetchEstablishmentMeans = async (taxonId, placeId) => {
    try {
      // If no place ID is provided (e.g., when using coordinates), we can't check establishment means
      if (!placeId) return null;

      const response = await fetch(
        `https://api.inaturalist.org/v1/taxa/${taxonId}?place_id=${placeId}`
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const taxon = data.results[0];

        // Check if the taxon is flagged as introduced or has explicit establishment means
        if (taxon.introduced === true) {
          return "introduced";
        }

        if (
          taxon.establishment_means &&
          taxon.establishment_means.establishment_means
        ) {
          return taxon.establishment_means.establishment_means;
        }
      }

      return null;
    } catch (err) {
      console.error("Error fetching establishment means:", err);
      return null;
    }
  };

  const fetchObservations = async () => {
    // Don't fetch if username is not provided
    if (!username) {
      setError("Please connect your iNaturalist account first");
      return;
    }

    // Don't fetch if neither coordinates nor placeId is provided
    if (!coordinates && !placeId) {
      setError("Please select a location first");
      return;
    }

    // Create a unique parameter key to track if we've already fetched with these parameters
    const paramKey = JSON.stringify({
      username,
      coordinates: coordinates
        ? {
            lat: coordinates.lat,
            lng: coordinates.lng,
            radius: coordinates.radius,
          }
        : null,
      placeId,
    });

    // Skip fetch if we've already fetched with the same parameters and have results
    if (paramKey === lastFetchParams && observations.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    setImportStatus(null);

    try {
      // Build the URL based on the location type, adding iconic_taxa=Plantae to filter for plants only
      let url = `https://api.inaturalist.org/v1/observations?user_login=${username}&per_page=100&iconic_taxa=Plantae`;

      if (placeId) {
        url += `&place_id=${placeId}`;
      } else if (coordinates) {
        url += `&lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${coordinates.radius}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      // Get existing plants from localStorage to filter out already added ones
      const savedPlants = localStorage.getItem("propertyPlants");
      const existingPlants = savedPlants ? JSON.parse(savedPlants) : [];

      // Create a set of existing iNaturalist IDs to avoid exact duplicates
      const existingInatIds = new Set(
        existingPlants.filter((plant) => plant.id).map((plant) => plant.id)
      );

      // Create lookups for existing plants by both Latin name and common name
      const existingLatinNameLookup = {};
      const existingCommonNameLookup = {};

      existingPlants.forEach((plant) => {
        if (plant.latinName) {
          existingLatinNameLookup[plant.latinName.toLowerCase()] = plant;
        }
        if (plant.name) {
          existingCommonNameLookup[plant.name.toLowerCase()] = plant;
        }
      });

      // Filter out exact iNaturalist ID matches first
      const filteredByInatId = data.results.filter(
        (obs) => !existingInatIds.has(obs.id.toString())
      );

      // Now filter out duplicate scientific names, keeping only the most recent observation for each species
      const uniqueByScientificName = [];
      const seenScientificNames = new Set();

      // Sort by observation date (most recent first) to prioritize newer observations
      const sortedObservations = filteredByInatId.sort((a, b) => {
        const dateA = new Date(a.observed_on || 0);
        const dateB = new Date(b.observed_on || 0);
        return dateB - dateA; // Most recent first
      });

      for (const obs of sortedObservations) {
        const scientificName = obs.taxon?.name?.toLowerCase();

        // Skip observations without scientific names
        if (!scientificName) {
          uniqueByScientificName.push(obs);
          continue;
        }

        // Only add if we haven't seen this scientific name before
        if (!seenScientificNames.has(scientificName)) {
          seenScientificNames.add(scientificName);
          uniqueByScientificName.push(obs);
        }
      }

      // Add match information to the filtered observations
      const observationsWithMatchInfo = uniqueByScientificName.map((obs) => {
        // Check if this observation matches an existing plant
        let matchedPlant = null;
        let matchType = null;

        // Check Latin name match first (most reliable)
        if (obs.taxon && obs.taxon.name) {
          matchedPlant = existingLatinNameLookup[obs.taxon.name.toLowerCase()];
          if (matchedPlant) matchType = "latin";
        }

        // If no Latin match, check common name matches
        if (!matchedPlant) {
          // Check taxon preferred common name
          if (obs.taxon && obs.taxon.preferred_common_name) {
            matchedPlant =
              existingCommonNameLookup[
                obs.taxon.preferred_common_name.toLowerCase()
              ];
            if (matchedPlant) matchType = "common";
          }

          // Check species_guess
          if (!matchedPlant && obs.species_guess) {
            matchedPlant =
              existingCommonNameLookup[obs.species_guess.toLowerCase()];
            if (matchedPlant) matchType = "species_guess";
          }
        }

        return {
          ...obs,
          matchedPlant,
          matchType,
          canUpdateExisting: !!matchedPlant,
        };
      });

      setObservations(observationsWithMatchInfo);

      console.log("observations", observationsWithMatchInfo);
      console.log(
        `Filtered out ${
          data.results.length - observationsWithMatchInfo.length
        } duplicate scientific names`
      );

      setLastFetchParams(paramKey);

      // Reset selected observations when we load a new set
      setSelectedObservations({});
    } catch (err) {
      console.error("Error fetching observations:", err);
      setError("Failed to fetch observations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch observations when parameters change
  useEffect(() => {
    if (username && (coordinates || placeId)) {
      fetchObservations();
    }
  }, [username, coordinates, placeId]);

  const toggleObservation = (id) => {
    setSelectedObservations({
      ...selectedObservations,
      [id]: !selectedObservations[id],
    });

    console.log("selectedObservations", selectedObservations);
  };

  const handleSelectAll = (observations) => {
    const allObservations = {};

    observations.map((obs) => {
      allObservations[obs.id] = true;
    });

    setSelectedObservations({
      ...allObservations,
    });

    console.log("selectedObservations all", selectedObservations);
  };
  const handleImport = async () => {
    const selectedIds = Object.keys(selectedObservations).filter(
      (id) => selectedObservations[id]
    );

    if (selectedIds.length === 0) {
      setError("Please select at least one observation to import.");
      return;
    }

    setImportStatus("importing");

    try {
      // Filter selected observations
      const selectedObservationsData = observations.filter(
        (obs) => selectedObservations[obs.id]
      );

      // Separate new plants from updates to existing plants
      const plantsToAdd = [];
      const plantsToUpdate = [];

      for (const obs of selectedObservationsData) {
        if (!obs.taxon) continue; // Skip observations without taxon info

        // Check establishment means if we have a place ID
        let establishmentMeans = null;
        if (placeId) {
          establishmentMeans = await fetchEstablishmentMeans(
            obs.taxon.id,
            placeId
          );
        }

        const isInvasive = establishmentMeans === "invasive";
        const plantData = {
          name:
            obs.species_guess ||
            obs.taxon.preferred_common_name ||
            obs.taxon.name,
          latinName: obs.taxon.name || "",
          location: obs.place_guess || "Unknown Location",
          imageUrl:
            obs.photos.length > 0
              ? obs.photos[0].url.replace("/square.", "/medium.")
              : "",
          rank: determineRank(establishmentMeans),
          iNatNotes: `${
            obs.taxon.wikipedia_summary || ""
          } Imported from iNaturalist. Observed on ${obs.observed_on}. ${
            obs.description || ""
          }\n\n${
            isInvasive
              ? `This plant is flagged as ${establishmentMeans} in this area by iNaturalist.`
              : ""
          }`,
          isInvasive: isInvasive,
          needsRemoval: isInvasive,
          found: true,
          dateAdded: obs.observed_on || new Date().toLocaleDateString(),
          id: obs.id.toString(),
        };

        if (obs.canUpdateExisting && obs.matchedPlant) {
          // This observation can update an existing plant
          const updatedPlant = updateExistingPlantWithObservation(
            obs.matchedPlant,
            plantData,
            obs
          );
          plantsToUpdate.push(updatedPlant);
        } else {
          // This is a new plant
          plantsToAdd.push(plantData);
        }
      }

      // Process new plants against documented database
      const enhancedNewPlants = await matchWithDatabase(plantsToAdd);

      // Pass both new plants and updates to the parent component
      onImportComplete({
        newPlants: enhancedNewPlants,
        updatedPlants: plantsToUpdate,
      });

      setImportStatus("success");
      setSelectedObservations({});
    } catch (err) {
      console.error("Error importing observations:", err);
      setImportStatus("error");
      setError("Error importing observations. Please try again.");
    }
  };

  // Helper function to update existing plant with new observation data
  const updateExistingPlantWithObservation = (
    existingPlant,
    newPlantData,
    observation
  ) => {
    const updated = { ...existingPlant };

    // Only update fields that are empty or missing
    if (!updated.latinName && newPlantData.latinName) {
      updated.latinName = newPlantData.latinName;
    }

    if (!updated.imageUrl && newPlantData.imageUrl) {
      updated.imageUrl = newPlantData.imageUrl;
    }

    if (!updated.type && newPlantData.type) {
      updated.type = newPlantData.type;
    }

    // Always mark as found if importing from iNaturalist
    updated.found = true;

    // Append location info if different
    if (newPlantData.location && newPlantData.location !== "Unknown Location") {
      if (!updated.location) {
        updated.location = newPlantData.location;
      } else if (!updated.location.includes(newPlantData.location)) {
        updated.location = `${updated.location}; ${newPlantData.location}`;
      }
    }

    // Append notes with iNaturalist info
    const iNatNote = newPlantData.iNatNotes;
    if (!updated.notes) {
      updated.iNatNotes = iNatNote.trim();
    } else if (
      !updated.iNatNotes.includes(`observation (${observation.observed_on})`)
    ) {
      updated.iNatNotes = updated.iNatNotes + iNatNote;
    }

    // Track the update
    updated.lastUpdatedFromINat = new Date().toISOString();
    updated.iNatObservationIds = updated.iNatObservationIds || [];
    if (!updated.iNatObservationIds.includes(observation.id.toString())) {
      updated.iNatObservationIds.push(observation.id.toString());
    }

    return updated;
  };

  // Helper function to determine invasive rank based on establishment means
  const determineRank = (establishmentMeans) => {
    // This is an approximation - you may want to define your own mapping
    switch (establishmentMeans) {
      case "invasive":
        return "A"; // Assuming more aggressive invasives get B rank
      case "introduced":
        return "D"; // Lowest concern
      case "naturalised":
        return "C"; // Assuming less aggressive introduced species get C rank
      case "native":
        return "N";
      default:
        return ""; // Default to lowest concern
    }
  };

  const isItInvasive = (rank) => {
    if (rank === "N" || rank === "") {
      return false;
    }
    return false;
  };

  const matchWithDatabase = async (plants) => {
    // Get the plants data from localStorage
    const savedPlants = localStorage.getItem("propertyPlants");
    const existingPlants = savedPlants ? JSON.parse(savedPlants) : [];

    // Create lookups for plants by both Latin name and common name
    const latinNameLookup = {};
    const commonNameLookup = {};

    existingPlants.forEach((plant) => {
      if (plant.latinName) {
        latinNameLookup[plant.latinName.toLowerCase()] = plant;
      }
      if (plant.name) {
        commonNameLookup[plant.name.toLowerCase()] = plant;
      }
    });

    // Process each imported plant to check for matches and update accordingly
    const updatedPlants = [];
    const plantsToAdd = [];

    for (const plant of plants) {
      // Check for Latin name match first (more reliable)
      let existingPlant = null;

      if (plant.latinName) {
        existingPlant = latinNameLookup[plant.latinName.toLowerCase()];
      }

      // If no Latin name match, try matching on common name
      if (!existingPlant && plant.name) {
        existingPlant = commonNameLookup[plant.name.toLowerCase()];
      }

      // If we found a match, update the existing plant with any missing information
      if (existingPlant) {
        const updatedPlant = { ...existingPlant };

        // Update any empty fields in the existing plant
        if (!updatedPlant.latinName && plant.latinName)
          updatedPlant.latinName = plant.latinName;
        if (!updatedPlant.imageUrl && plant.imageUrl)
          updatedPlant.imageUrl = plant.imageUrl;
        if (!updatedPlant.location && plant.location)
          updatedPlant.location = plant.location;
        if (!updatedPlant.type && plant.type) updatedPlant.type = plant.type;
        if (!updatedPlant.notes) {
          updatedPlant.notes = plant.notes;
        } else if (plant.notes) {
          // Append new notes without duplication
          updatedPlant.notes = `${updatedPlant.notes}\n\nAdditional info from iNaturalist import: ${plant.notes}`;
        }

        // Mark as matched for UI display purposes
        updatedPlant.isMatched = true;
        updatedPlant.lastUpdated = new Date().toISOString();

        // Add to updates list
        updatedPlants.push(updatedPlant);
      } else {
        // Check if the plant matches any documented plants (from your pdxPlants data)
        const documentMatch = matchAgainstDocumentedPlants(plant.latinName);
        if (documentMatch) {
          plantsToAdd.push({
            ...plant,
            rank: documentMatch.rank || plant.rank,
            type: documentMatch.type || plant.type,
            isInvasive:
              documentMatch.isInvasive !== undefined
                ? documentMatch.isInvasive
                : isItInvasive(documentMatch.rank),
            needsRemoval:
              documentMatch.needsRemoval !== undefined
                ? documentMatch.needsRemoval
                : false,
            iNatNotes: plant.notes,
            isMatched: false, // Not matched to user's existing plants
            isDocumentMatched: true, // But matched to our documentation
          });
        } else {
          // Brand new plant
          plantsToAdd.push({
            ...plant,
            isMatched: false,
            isDocumentMatched: false,
          });
        }
      }
    }

    // Update the existing plants in localStorage
    if (updatedPlants.length > 0) {
      const updatedExistingPlants = existingPlants.map((plant) => {
        const updatedPlant = updatedPlants.find((p) => p.id === plant.id);
        return updatedPlant || plant;
      });

      localStorage.setItem(
        "propertyPlants",
        JSON.stringify(updatedExistingPlants)
      );
    }

    // Return only the new plants to add
    return plantsToAdd;
  };

  function matchAgainstDocumentedPlants(latinName) {
    if (!latinName) return null;

    return pdxPlants.find(
      (plant) => plant.latinName.toLowerCase() === latinName.toLowerCase()
    );
  }

  // Manual refresh button handler
  const handleRefresh = () => {
    // Reset the lastFetchParams to force a new fetch
    setLastFetchParams(null);
    fetchObservations();
  };

  const filterObservations = (observations, searchTerm) => {
    if (!searchTerm.trim()) return observations;

    const term = searchTerm.toLowerCase();

    return observations.filter((obs) => {
      // Search in common name (from taxon or species_guess)
      const commonName =
        obs.taxon?.preferred_common_name || obs.species_guess || "";
      if (commonName.toLowerCase().includes(term)) return true;

      // Search in Latin name
      const latinName = obs.taxon?.name || "";
      if (latinName.toLowerCase().includes(term)) return true;

      // Search in location
      const location = obs.place_guess || "";
      if (location.toLowerCase().includes(term)) return true;

      // Search in observation date
      const date = obs.observed_on || "";
      if (date.includes(term)) return true;

      // Search in description
      const description = obs.description || "";
      if (description.toLowerCase().includes(term)) return true;

      return false;
    });
  };

  return (
    <div className="">
      <h2 className="text-xl font-semibold mb-4">
        Import Your iNaturalist Observations
      </h2>

      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-stone-600">
          {observations.length > 0
            ? `${observations.length} unique species found`
            : "No observations found yet"}
        </p>

        <button
          onClick={handleRefresh}
          className="text-sm text-emerald-600 hover:text-emerald-800"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {observations.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-stone-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search observations by name, location, date..."
              className="w-full pl-10 pr-4 py-2 rounded-sm bg-white text-sm text-stone-900 outline -outline-offset-1 outline-stone-300 focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600"
              value={observationSearchTerm}
              onChange={(e) => setObservationSearchTerm(e.target.value)}
            />
          </div>
          {observationSearchTerm && (
            <p className="text-xs text-stone-500 mt-1">
              Showing{" "}
              {filterObservations(observations, observationSearchTerm).length}{" "}
              of {observations.length} observations
            </p>
          )}
        </div>
      )}

      <div className="p-1 mb-6 overflow-y-scroll h-[60vh]">
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Loading observations...</p>
          </div>
        ) : error ? (
          <div className="text-rose-600 py-4">
            <p>{error}</p>
            <button
              onClick={fetchObservations}
              className="mt-2 px-3 py-1 bg-stone-600 text-white rounded-sm hover:bg-stone-500"
            >
              Try Again
            </button>
          </div>
        ) : observations.length === 0 ? (
          <div className="py-4">
            <p>
              {loading
                ? "Loading..."
                : "No new plant observations found. This could be because you've already imported all your plants or there are no plant observations in this location."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p>Select the plants you want to import:</p>
            </div>
            <button
              onClick={() =>
                handleSelectAll(
                  filterObservations(observations, observationSearchTerm)
                )
              }
              className="text-sm text-emerald-600 hover:text-emerald-800"
              disabled={loading}
            >
              {loading ? "Loading..." : "Select All"}
            </button>
            <ul
              role="list"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6"
            >
              {filterObservations(observations, observationSearchTerm).map(
                (obs) => (
                  <li
                    key={obs.id}
                    className={`relative ring-2 rounded-sm ${
                      selectedObservations[obs.id]
                        ? "ring-emerald-600 ring-offset-2 bg-emerald-50"
                        : "ring-stone-200 ring-offset-2"
                    }`}
                    onClick={() => toggleObservation(obs.id)}
                  >
                    <div className="group overflow-hidden rounded-sm bg-stone-100 ">
                      {obs.photos && obs.photos.length > 0 ? (
                        <img
                          alt={obs.species_guess || "Plant observation"}
                          src={obs.photos[0].url.replace(
                            "/square.",
                            "/medium."
                          )}
                          className="pointer-events-none mx-auto aspect-3/2 w-full max-w-sm rounded-sm object-cover group-hover:opacity-75"
                        />
                      ) : (
                        <div className="pointer-events-none mx-auto aspect-3/2 w-full max-w-sm rounded-sm flex items-center justify-center bg-stone-200 text-stone-500">
                          No Image
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute inset-0 focus:outline-none"
                      >
                        <span className="sr-only">Select</span>
                      </button>

                      {obs.canUpdateExisting && (
                        <div className="absolute top-1 left-1 bg-stone-800 text-white px-1 py-0.5 rounded-xs text-xs border-2 border-white/80 uppercase">
                          Update
                        </div>
                      )}

                      {!obs.canUpdateExisting && (
                        <div className="absolute top-1 left-1 bg-emerald-800 text-white px-1 py-0.5 rounded-xs text-xs border-2 border-white/80 uppercase">
                          New
                        </div>
                      )}
                    </div>
                    <div className="px-1">
                      <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-stone-900">
                        {obs.taxon?.preferred_common_name ||
                          obs.species_guess ||
                          "Unknown Plant"}
                      </p>
                      <p className="pointer-events-none block text-xs italic text-stone-500">
                        {obs.taxon?.name || ""}
                      </p>
                      <p className="pointer-events-none block text-xs mt-2 text-stone-500">
                        {obs.place_guess || "Unknown Location"}
                      </p>

                      <p className="pointer-events-none block text-xs mt-2 text-stone-500">
                        {obs.observed_on || "Unknown Date"}
                      </p>
                    </div>
                  </li>
                )
              )}
            </ul>

            {observationSearchTerm &&
              filterObservations(observations, observationSearchTerm).length ===
                0 && (
                <div className="text-center py-8 text-stone-500">
                  <p>
                    No observations match your search term "
                    {observationSearchTerm}"
                  </p>
                  <button
                    onClick={() => setObservationSearchTerm("")}
                    className="mt-2 text-emerald-600 hover:text-emerald-800 text-sm"
                  >
                    Clear search
                  </button>
                </div>
              )}
          </>
        )}
      </div>

      <div className="sticky flex justify-between items-center">
        <div>
          {importStatus === "success" && (
            <span className="text-emerald-600">
              ✓ Plants imported successfully
            </span>
          )}
          {importStatus === "error" && (
            <span className="text-rose-600">✗ Error importing plants</span>
          )}
        </div>
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-500 disabled:bg-stone-400 disabled:cursor-not-allowed"
          disabled={
            loading ||
            importStatus === "importing" ||
            Object.keys(selectedObservations).filter(
              (id) => selectedObservations[id]
            ).length === 0
          }
        >
          {importStatus === "importing"
            ? "Importing..."
            : "Import Selected Plants"}
        </button>
      </div>
    </div>
  );
}

export default ImportObservations;
