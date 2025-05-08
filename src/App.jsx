import { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Plus,
  Skull,
  Edit,
  Save,
  ChevronDown,
  Leaf,
  Sprout,
} from "lucide-react";
import BackupManager from "./BackupManager";

// Main App Component
export default function PlantTracker() {
  const [plants, setPlants] = useState(() => {
    // Load from localStorage if available
    const savedPlants = localStorage.getItem("propertyPlants");
    return savedPlants ? JSON.parse(savedPlants) : [];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInvasive, setFilterInvasive] = useState(false);
  const [filterRemoval, setFilterRemoval] = useState(false);
  const [filterFound, setFilterFound] = useState(false);
  const [filterRank, setFilterRank] = useState("");
  const [filterType, setFilterType] = useState("");
  const [editingPlant, setEditingPlant] = useState(null);

  // Save plants to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("propertyPlants", JSON.stringify(plants));
  }, [plants]);

  // Add a new plant
  const addPlant = (plant) => {
    console.log("foo");
    setPlants([
      ...plants,
      { ...plant, id: Date.now(), dateAdded: new Date().toLocaleDateString() },
    ]);

    setShowAddForm(false);
  };

  // Remove a plant
  const removePlant = (id) => {
    setPlants(plants.filter((plant) => plant.id !== id));
  };

  // Toggle removal status
  const toggleRemoval = (id) => {
    setPlants(
      plants.map((plant) =>
        plant.id === id
          ? { ...plant, needsRemoval: !plant.needsRemoval }
          : plant
      )
    );
  };

  // Toggle found status
  const toggleFound = (id) => {
    setPlants(
      plants.map((plant) =>
        plant.id === id ? { ...plant, found: !plant.found } : plant
      )
    );
  };

  // Update plant
  const updatePlant = (updatedPlant) => {
    setPlants(
      plants.map((plant) =>
        plant.id === updatedPlant.id ? updatedPlant : plant
      )
    );
    setEditingPlant(null);
  };

  // Filter plants based on search and filters
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plant.notes &&
        plant.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesInvasive = filterInvasive ? plant.isInvasive : true;
    const matchesRemoval = filterRemoval ? plant.needsRemoval : true;
    const matchesFound = filterFound ? plant.found : true;
    const matchesRank = filterRank
      ? plant.rank && plant.rank.charAt(0).toUpperCase() === filterRank
      : true;

    // New condition for plant type filtering
    const matchesType = filterType
      ? plant.type && plant.type.toLowerCase() === filterType.toLowerCase()
      : true;

    return (
      matchesSearch &&
      matchesInvasive &&
      matchesRemoval &&
      matchesFound &&
      matchesRank &&
      matchesType
    );
  });

  return (
    <div className="flex flex-col lg:h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-stone-900 md:flex md:items-center md:justify-between space-x-2 p-4 border-b border-stone-200">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl/7 font-bold text-stone-200 sm:truncate sm:text-3xl sm:tracking-tight">
            Plant Tracker
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <BackupManager
            onImport={(importedPlants) => setPlants(importedPlants)}
          />
        </div>
        <button
          className="inline-flex items-center gap-x-2 rounded-sm bg-emerald-600 px-3.5 py-2 text-sm text-white shadow-xs hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} />
          <span>Add Plant</span>
        </button>
      </div>

      <div className="bg-stone-900 mb-6 p-4 flex flex-col md:flex-row gap-4 text-white">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search plants..."
            className="w-full pl-10 pr-4 py-2 rounded-sm bg-white/10 py-1.5 text-base outline-1 -outline-offset-1 outline-stone-100 placeholder:text-stone-300 focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-col lg:flex-row flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="h-5 w-5 accent-emerald-600"
              checked={filterInvasive}
              onChange={() => setFilterInvasive(!filterInvasive)}
            />
            <span className="ml-2 text-sm">Invasive</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="h-5 w-5 accent-emerald-600"
              checked={filterRemoval}
              onChange={() => setFilterRemoval(!filterRemoval)}
            />
            <span className="ml-2 text-sm">Needs Removal</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="h-5 w-5 accent-emerald-600"
              checked={filterFound}
              onChange={() => setFilterFound(!filterFound)}
            />
            <span className="ml-2 text-sm">Found</span>
          </label>

          <RankFilter selectedRank={filterRank} onChange={setFilterRank} />
          <PlantTypeFilter selectedType={filterType} onChange={setFilterType} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        {/* Search and Filter Bar */}

        {/* Plant List */}
        {filteredPlants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onRemove={removePlant}
                onToggleRemoval={toggleRemoval}
                onToggleFound={toggleFound}
                onEdit={() => setEditingPlant(plant)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-stone-500">
            <p className="text-xl">No plants found</p>
            <p className="mt-2">
              Add some plants to your tracker or adjust your filters
            </p>
          </div>
        )}
      </main>

      {/* Add Plant Modal */}
      {showAddForm && (
        <PlantForm onSubmit={addPlant} onCancel={() => setShowAddForm(false)} />
      )}

      {/* Edit Plant Modal */}
      {editingPlant && (
        <PlantForm
          plant={editingPlant}
          onSubmit={updatePlant}
          onCancel={() => setEditingPlant(null)}
        />
      )}
    </div>
  );
}

function RankFilter({ selectedRank, onChange }) {
  return (
    <div className="relative">
      <label htmlFor="rank" className="absolute -top-4 text-xs uppercase">
        Plant Ranking:
      </label>
      <div className="grid grid-cols-1">
        <select
          id="rank-filter"
          value={selectedRank}
          onChange={(e) => onChange(e.target.value)}
          className="col-start-1 row-start-1 w-full appearance-none rounded-sm py-1 pl-3 pr-8 text-base text-white/80 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
        >
          <option value="">All Ranks</option>
          <option value="N">N - Native</option>
          <option value="A">A - High Priority Invasive</option>
          <option value="B">B - Medium Priority Invasive</option>
          <option value="C">C - Widespread Invasive</option>
          <option value="D">D - Less Aggressive Invasive</option>
          <option value="W">W - Watch Species Invasive</option>
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-white sm:size-4"
        />
      </div>
    </div>
  );
}

function PlantTypeFilter({ selectedType, onChange }) {
  return (
    <div className="relative">
      <label
        htmlFor="type-filter"
        className="absolute -top-4 text-xs uppercase"
      >
        Type:
      </label>
      <div className="grid grid-cols-1">
        <select
          id="type-filter"
          value={selectedType}
          onChange={(e) => onChange(e.target.value)}
          className="col-start-1 row-start-1 w-full appearance-none rounded-sm py-1 pl-3 pr-8 text-base text-white/80 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
        >
          <option value="">All Types</option>
          <option value="Tree">Tree</option>
          <option value="Shrub">Shrub</option>
          <option value="Herbaceous">Herbaceous</option>
          <option value="Aquatic">Aquatic</option>
          <option value="Tree/shrub">Tree/Shrub</option>
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-white sm:size-4"
        />
      </div>
    </div>
  );
}

// Plant Card Component
function PlantCard({
  plant,
  onRemove,
  onToggleRemoval,
  onToggleFound,
  onEdit,
}) {
  const {
    id,
    name,
    latinName,
    location,
    type,
    rank,
    imageUrl,
    isInvasive,
    needsRemoval,
    found,
    dateAdded,
    notes,
  } = plant;

  const rankColor = (rank) => {
    switch (rank) {
      case "A":
        return "text-rose-600"; // Deep red - highest threat, limited distribution
      case "B":
        return "text-orange-500"; // Vivid orange - high threat, limited distribution
      case "C":
        return "text-amber-400"; // Bright amber - widely distributed
      case "D":
        return "text-yellow-500"; // Strong yellow - less aggressive
      case "W":
        return "text-blue-400"; // True blue - watch species
      case "N":
        return "text-emerald-500"; // Emerald green - native plants
      default:
        return "text-stone-400"; // Grey for unknown ranks
    }
  };

  const bgColor = (found, isInvasive) => {
    if (found && isInvasive) return "bg-amber-100";
    if (found && !isInvasive) return "bg-emerald-100";
    return "bg-white";
  };

  return (
    <div
      className={`rounded-sm shadow-md overflow-hidden border-t-6 flex flex-col ${
        isInvasive ? "border-rose-400" : "border-emerald-600"
      } ${bgColor(found, isInvasive)}`}
    >
      <div className="relative h-48 bg-stone-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <Leaf size={48} className="text-stone-400" />
            <span className="ml-2 text-stone-500">No image</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-full bg-white p-3 shadow-xs hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Edit size={16} className="text-black" />
          </button>

          <button
            onClick={() => onRemove(id)}
            className="rounded-full bg-white p-3 shadow-xs hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Trash2 size={16} className="text-rose-400" />
          </button>
        </div>

        <div className="absolute top-2 left-2">
          <div className="inline-flex items-center gap-x-1.5 rounded-sm px-2 py-1 text-xs bg-white text-stone-900 ring-1 ring-stone-200 ring-inset">
            <input
              type="checkbox"
              id={`found-${id}`}
              checked={found}
              onChange={() => onToggleFound(id)}
              className="h-5 w-5 accent-stone-600"
            />
            <label htmlFor={`found-${id}`} className="ml-2 text-stone-700">
              Found
            </label>
          </div>
        </div>

        {isInvasive ? (
          <div className="absolute bottom-2 left-2 flex gap-2">
            <span className="inline-flex items-center gap-x-1.5 rounded-sm px-2 py-1 text-xs font-medium text-stone-900 ring-1 ring-stone-200 ring-inset bg-white">
              <Skull className={`size-4 ${rankColor(rank)}`} />
              {rank} Invasive
            </span>
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 flex gap-2">
            <span className="inline-flex items-center gap-x-1.5 rounded-sm px-2 py-1 text-xs font-medium text-stone-900 ring-1 ring-stone-200 ring-inset bg-white">
              <Sprout className={`size-4 ${rankColor(rank)}`} />
              Non-Invasive
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <span className="text-xs text-stone-600 italic">{latinName}</span>
        <h3 className="text-lg font-semibold text-stone-800 mb-1">{name}</h3>

        <p className="text-sm text-stone-600 mb-1">
          <strong>Type:</strong> {type}
        </p>

        <p className="text-sm text-stone-600 mb-1">
          <strong>Where:</strong> {location}
        </p>

        {notes && <p className="text-sm text-stone-700 mt-2">{notes}</p>}
      </div>
    </div>
  );
}

// Plant Form Component - Using div instead of form
function PlantForm({ plant, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    plant || {
      name: "",
      latinName: "",
      location: "",
      imageUrl: "",
      rank: "",
      type: "",
      isInvasive: false,
      needsRemoval: false,
      found: false,
      notes: "",
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Function to resize an image file
  const resizeImage = (
    file,
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.5
  ) => {
    return new Promise((resolve, reject) => {
      // Create a FileReader to read the file
      const reader = new FileReader();

      // Set up FileReader callback
      reader.onload = (readerEvent) => {
        // Create an image object
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }

          // Create a canvas element
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          // Draw the image on the canvas
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to Blob (file-like object)
          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            file.type,
            quality
          );
        };

        // Handle image loading error
        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        // Set the image source to the file contents
        img.src = readerEvent.target.result;
      };

      // Handle file reading error
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      // Read the file as a data URL
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Resize the image
        const resizedImage = await resizeImage(file);

        // Create a data URL from the resized image
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData({
            ...formData,
            imageUrl: event.target.result,
          });
        };
        reader.readAsDataURL(resizedImage);
      } catch (error) {
        console.error("Error resizing image:", error);

        // Fallback to original image if resizing fails
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData({
            ...formData,
            imageUrl: event.target.result,
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.location) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {plant ? "Edit Plant" : "Add New Plant"}
          </h2>

          <div>
            <div className="mb-4">
              <label className="block text-stone-700 text-sm font-medium mb-1">
                Plant Common Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-sm bg-white py-1 pl-3 text-sm text-stone-900 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                placeholder="Enter plant name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-stone-700 text-sm font-medium mb-1">
                Plant Latin Name
              </label>
              <input
                type="text"
                name="latinName"
                value={formData.latinName}
                onChange={handleChange}
                className="w-full  rounded-sm bg-white py-1 pl-3 text-sm text-stone-900 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                placeholder="Enter plant Latin name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-stone-700 text-sm font-medium mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full  rounded-sm bg-white py-1 pl-3 text-sm text-stone-900 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                placeholder="e.g., Back garden, North fence"
              />
            </div>

            <div className="mb-4 flex space-x-4">
              <div>
                <label
                  htmlFor="rank"
                  className="block text-stone-700 text-sm font-medium mb-1"
                >
                  Ranking
                </label>
                <div className="grid grid-cols-1">
                  <select
                    name="rank"
                    value={formData.rank}
                    onChange={handleChange}
                    className="col-start-1 row-start-1 w-full appearance-none rounded-sm bg-white py-1 pl-3 pr-8 text-base text-stone-900 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                  >
                    <option value=""></option>
                    <option value="N">N - Native</option>
                    <option value="A">A - High Priority Invasive</option>
                    <option value="B">B - Medium Priority Invasive</option>
                    <option value="C">C - Widespread Invasive</option>
                    <option value="D">D - Less Aggressive Invasive</option>
                    <option value="W">W - Watch Species Invasive</option>
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-stone-500 sm:size-4"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-stone-700 text-sm font-medium mb-1"
                >
                  Type:
                </label>
                <div className="grid grid-cols-1">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="col-start-1 row-start-1 w-full appearance-none rounded-sm bg-white py-1 pl-3 pr-8 text-base text-stone-900 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                  >
                    <option value=""></option>
                    <option value="Tree">Tree</option>
                    <option value="Shrub">Shrub</option>
                    <option value="Herbaceous">Herbaceous</option>
                    <option value="Aquatic">Aquatic</option>
                    <option value="Tree/shrub">Tree/Shrub</option>
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-stone-500 sm:size-4"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-stone-700 text-sm font-medium mb-1">
                Plant Image
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-sm cursor-pointer hover:bg-stone-200 transition"
                >
                  Choose Image
                </label>
                {formData.imageUrl && (
                  <div className="ml-4 h-10 w-10 rounded overflow-hidden">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 text-sm">
              <div className="space-x-5 flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isInvasive"
                    checked={formData.isInvasive}
                    onChange={handleChange}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  <span className="ml-2 text-stone-700">Invasive</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="needsRemoval"
                    checked={formData.needsRemoval}
                    onChange={handleChange}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  <span className="ml-2 text-stone-700">Needs Removal</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="found"
                    checked={formData.found}
                    onChange={handleChange}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  <span className="ml-2 text-stone-700">Found</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-stone-700 text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full  rounded-sm bg-white py-1 pl-3 text-sm text-stone-900 outline outline-1 -outline-offset-1 outline-stone-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                placeholder="Add any additional notes..."
              ></textarea>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-sm bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-900 shadow-xs ring-1 ring-stone-300 ring-inset hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="inline-flex items-center gap-x-2 rounded-sm bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <Save size={18} className="-ml-0.5 size-5" />
                <span>{plant ? "Save Changes" : "Add Plant"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
