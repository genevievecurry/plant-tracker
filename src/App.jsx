import { useState, useEffect } from "react";
import { Search, Trash2, Plus, Check, X, Edit, Save } from "lucide-react";
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

    return matchesSearch && matchesInvasive && matchesRemoval;
  });

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      {/* Header */}
      <div class="bg-stone-900 md:flex md:items-center md:justify-between p-4 border-b border-stone-200">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl/7 font-bold text-stone-200 sm:truncate sm:text-3xl sm:tracking-tight">
            Plant Tracker
          </h2>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4">
          <BackupManager
            onImport={(importedPlants) => setPlants(importedPlants)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-3 text-stone-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search plants..."
              className="w-full pl-10 pr-4 py-2 rounded-sm bg-white py-1.5 text-base text-stone-900 outline-1 -outline-offset-1 outline-stone-300 placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 accent-emerald-600"
                checked={filterInvasive}
                onChange={() => setFilterInvasive(!filterInvasive)}
              />
              <span className="ml-2 text-stone-700 text-sm">Invasive Only</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 accent-emerald-600"
                checked={filterRemoval}
                onChange={() => setFilterRemoval(!filterRemoval)}
              />
              <span className="ml-2 text-stone-700 text-sm">Needs Removal</span>
            </label>

            <button
              className="inline-flex items-center gap-x-2 rounded-sm bg-emerald-600 px-3.5 py-2.5 text-sm text-white shadow-xs hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={18} />
              <span>Add Plant</span>
            </button>
          </div>
        </div>

        {/* Plant List */}
        {filteredPlants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onRemove={removePlant}
                onToggleRemoval={toggleRemoval}
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

// Plant Card Component
function PlantCard({ plant, onRemove, onToggleRemoval, onEdit }) {
  const {
    id,
    name,
    location,
    imageUrl,
    isInvasive,
    needsRemoval,
    dateAdded,
    notes,
  } = plant;

  return (
    <div
      className={`bg-white rounded-sm shadow-md overflow-hidden border-t-6 ${
        isInvasive ? "border-rose-400" : "border-stone-200"
      }`}
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
            {/* <Image size={48} className="text-stone-400" /> */}
            <span className="ml-2 text-stone-500">No image</span>
          </div>
        )}

        {isInvasive && (
          <div className="absolute top-2 left-2 flex gap-2">
            <span className="inline-flex items-center gap-x-1.5 rounded-sm px-2 py-1 text-xs font-medium text-stone-900 ring-1 ring-stone-200 ring-inset bg-white">
              <svg
                class="size-1.5 fill-rose-400"
                viewBox="0 0 6 6"
                aria-hidden="true"
              >
                <circle cx="3" cy="3" r="3" />
              </svg>
              Invasive
            </span>
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
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-2">{name}</h3>

        <p className="text-sm text-stone-600 mb-1">
          <strong>Location:</strong> {location}
        </p>

        <p className="text-sm text-stone-600 mb-1">
          <strong>Added:</strong> {dateAdded}
        </p>

        {notes && (
          <p className="text-sm text-stone-700 mt-2 italic">
            {notes.length > 100 ? `${notes.substring(0, 100)}...` : notes}
          </p>
        )}

        {/* <div className="mt-4 lg:flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`removal-${id}`}
              checked={needsRemoval}
              onChange={() => onToggleRemoval(id)}
              className="h-5 w-5 accent-amber-600"
            />
            <label
              htmlFor={`removal-${id}`}
              className="ml-2 text-sm text-stone-700"
            >
              Mark for removal
            </label>
          </div>

          {needsRemoval && (
            <span class="inline-flex items-center gap-x-1.5 rounded-sm px-2 py-1 text-xs font-medium text-stone-900 ring-1 ring-stone-200 ring-inset">
              <svg
                class="size-1.5 fill-amber-500"
                viewBox="0 0 6 6"
                aria-hidden="true"
              >
                <circle cx="3" cy="3" r="3" />
              </svg>
              To Remove
            </span>
          )}
        </div> */}
      </div>
    </div>
  );
}

// Plant Form Component - Using div instead of form
function PlantForm({ plant, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    plant || {
      name: "",
      location: "",
      imageUrl: "",
      isInvasive: false,
      needsRemoval: false,
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
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.6
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
                Plant Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter plant name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-stone-700 text-sm font-medium mb-1">
                Location on Property *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Back garden, North fence"
              />
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

            <div className="mb-4">
              <div className="space-y-5">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isInvasive"
                    checked={formData.isInvasive}
                    onChange={handleChange}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  <span className="ml-2 text-stone-700">Invasive Species</span>
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
                className="w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
