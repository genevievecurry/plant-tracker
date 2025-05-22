import { useState } from "react";

function INaturalistConnection({ username, setUsername }) {
  const [localUsername, setLocalUsername] = useState(username || "");
  const [isConnected, setIsConnected] = useState(!!username);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      // Validate that the username exists on iNaturalist
      const response = await fetch(
        `https://api.inaturalist.org/v1/users/autocomplete?q=${localUsername}`
      );
      const data = await response.json();

      if (data.results.length > 0) {
        // Save username to localStorage
        localStorage.setItem("inaturalist_username", localUsername);
        // Update parent component state
        setUsername(localUsername);
        setIsConnected(true);
        setError(null);
      } else {
        setError("Username not found on iNaturalist");
      }
    } catch (err) {
      console.error("Error", err);
      setError("Connection failed. Please try again.");
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("inaturalist_username");
    setLocalUsername("");
    // Update parent component state
    setUsername("");
    setIsConnected(false);
  };

  return (
    <div className="mb-6 text-stone-800">
      <h2 className="text-xl font-semibold mb-4">Connect to iNaturalist</h2>

      {!isConnected ? (
        <div>
          <div className="mb-4">
            <label className="text-xs uppercase">iNaturalist Username</label>
            <div className="flex mt-1">
              <input
                type="text"
                value={localUsername}
                onChange={(e) => setLocalUsername(e.target.value)}
                className="w-full appearance-none rounded-sm py-1 px-3 text-base text-stone-900 outline -outline-offset-1 outline-stone-900 focus:outline focus:-outline-offset-2 focus:outline-emerald-600 sm:text-sm/6"
                placeholder="Enter your iNaturalist username"
              />
              <button
                onClick={handleConnect}
                className="ml-3 inline-flex items-center px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 rounded-sm"
              >
                Connect
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <p>
              Connected as <strong>{username}</strong>
            </p>
            <button
              onClick={handleDisconnect}
              className="ml-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default INaturalistConnection;
