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

          // Save to localStorage
          localStorage.setItem("propertyPlants", JSON.stringify(importedData));

          // If callback provided, use it to update the app state
          if (onImport) {
            onImport(importedData);
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
    <div className="flex gap-4 mt-4">
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2 hover:bg-green-700 transition"
      >
        <Download size={18} />
        <span>Export Plants Data</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setImporting(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Upload size={18} />
          <span>Import Plants Data</span>
        </button>
        <input
          type="file"
          accept=".json"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleImport}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

export default BackupManager;
