// public/js/apis/tableApi.js

// Get JWT token from cookies
function getAuthToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1] || "";
}

// Create a new table on the server
async function createTableOnServer(tableData) {
  try {
    console.log("Creating table on server:", tableData);
    const token = getAuthToken();

    const response = await fetch("/tables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(tableData),
    });

    if (response.redirected) {
      window.location.href = response.url;
      return;
    }

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("Table created successfully:", result.data);
      return result.data;
    } else {
      console.error("Failed to create table:", result.message);
      throw new Error(result.message || "Failed to create table");
    }
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  }
}

// Update an existing table on the server
async function updateTableOnServer(tableElement) {
  try {
    if (!tableElement.dataset.serverId) {
      console.log("Table not yet saved to server, skipping update");
      return;
    }

    const tableData = {
      name: tableElement.textContent,
      tableType: tableElement.dataset.type,
      seats: parseInt(tableElement.dataset.seats) || 4,
      position: {
        x: parseInt(tableElement.style.left) || 0,
        y: parseInt(tableElement.style.top) || 0,
      },
      capacity: {
        minParty: parseInt(tableElement.dataset.minParty) || 1,
        maxParty: parseInt(tableElement.dataset.maxParty) || parseInt(tableElement.dataset.seats) || 4,
      },
      status: "active",
      isReserved: tableElement.dataset.isReserved === "true",
    };

    console.log("Updating table on server:", tableData);
    const token = getAuthToken();

    const response = await fetch(`/tables/${tableElement.dataset.serverId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(tableData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("Table updated successfully:", result.data);
      return result.data;
    } else {
      console.error("Failed to update table:", result.message);
      throw new Error(result.message || "Failed to update table");
    }
  } catch (error) {
    console.error("Error updating table:", error);
    throw error;
  }
}

// Delete a table from the server
async function deleteTableOnServer(serverId) {
  try {
    console.log("Deleting table on server:", serverId);
    const token = getAuthToken();

    const response = await fetch(`/tables/${serverId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("Table deleted successfully");
      return true;
    } else {
      console.error("Failed to delete table:", result.message);
      throw new Error(result.message || "Failed to delete table");
    }
  } catch (error) {
    console.error("Error deleting table:", error);
    throw error;
  }
}

// Fetch tables for a specific floor plan
async function fetchTablesForFloorPlan(floorPlanId) {
  try {
    if (!floorPlanId) {
      console.log("No floor plan ID provided, skipping table fetch");
      return [];
    }
    
    console.log("Fetching tables for floor plan:", floorPlanId);
    const token = getAuthToken();
    
    const response = await fetch(`/tables/floorplan/${floorPlanId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`Successfully fetched ${result.data.length} tables for floor plan`);
      return result.data;
    } else {
      console.error("Failed to fetch tables:", result.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching tables:", error);
    return [];
  }
}

// Expose to window object for non-module environments
window.TableApi = {
  createTableOnServer,
  updateTableOnServer,
  deleteTableOnServer,
  fetchTablesForFloorPlan,
  getAuthToken
};
