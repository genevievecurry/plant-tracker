import { Download, Upload, Save } from "lucide-react";
import { useState } from "react";

function BackupManager({ onImport }) {
  // This function creates and downloads a JSON file with the plants data
  const handleExport = () => {
    try {
      // Get data from localStorage
      const plantsData = localStorage.getItem("propertyPlants");

      if (!plantsData || plantsData === "[]") {
        alert("No plant data to export");
        return;
      }

      // Create blob with the data
      const blob = new Blob([plantsData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create a temporary download link
      const link = document.createElement("a");
      link.href = url;

      // Create filename with current date
      const date = new Date().toISOString().split("T")[0];
      link.download = `plants-backup-${date}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data");
    }
  };

  // Import functionality
  const [importing, setImporting] = useState(false);

  const handleImport = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);

          // Validate that the imported data is an array
          if (!Array.isArray(importedData)) {
            throw new Error("Invalid data format");
          }

          // Define the expected fields with default values
          const expectedFields = {
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
            isEdible: false,
          };

          // Process each plant item to ensure all required fields exist
          const processedData = importedData.map((plant) => {
            // Create a new object with all expected fields and their default values
            const processedPlant = { ...expectedFields };

            // Overlay with the actual data from the imported plant
            Object.keys(plant).forEach((key) => {
              processedPlant[key] = plant[key];
            });

            // Ensure the ID is preserved or generated if missing
            if (!processedPlant.id) {
              processedPlant.id =
                Date.now() + Math.random().toString(36).substr(2, 5);
            }

            // Ensure dateAdded is preserved or set to current date if missing
            if (!processedPlant.dateAdded) {
              processedPlant.dateAdded = new Date().toLocaleDateString();
            }

            return processedPlant;
          });

          // Save to localStorage
          localStorage.setItem("propertyPlants", JSON.stringify(processedData));

          // If callback provided, use it to update the app state
          if (onImport) {
            onImport(processedData);
          } else {
            // Otherwise just reload the page
            window.location.reload();
          }

          alert("Import successful!");
        } catch (error) {
          console.error("Import parsing failed:", error);
          alert("The selected file contains invalid data");
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import data");
    } finally {
      // Reset the input
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <span className="isolate inline-flex rounded-sm shadow-xs">
      <button
        onClick={handleExport}
        type="button"
        className="relative inline-flex items-center gap-x-1.5 rounded-l-sm bg-stone-900 px-3 py-2 text-sm text-stone-200 ring-1 ring-stone-300 ring-inset hover:bg-stone-700 focus:z-10"
      >
        <Download size={18} />
        <span>Export Data</span>
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setImporting(true)}
          className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-sm bg-stone-900 px-3 py-2 text-sm text-stone-200 ring-1 ring-stone-300 ring-inset hover:bg-stone-700 focus:z-10"
        >
          <span>Import Data</span>
          <Upload size={18} />
        </button>
        <input
          type="file"
          accept=".json"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleImport}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </span>
  );
}

export default BackupManager;
