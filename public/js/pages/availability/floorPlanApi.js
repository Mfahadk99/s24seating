// public/js/apis/floorPlanApi.js

// Get JWT token from cookies
function getAuthToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1] || "";
}

// Fetch all floor plans for a restaurant
async function fetchFloorPlans(restaurantId) {
  try {
    console.log("Fetching floor plans for restaurant:", restaurantId);
    
    const token = getAuthToken();
    
    const response = await fetch(`/floorplans/restaurant/${restaurantId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    
    console.log("Floor plans API response status:", response.status);
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log("Floor plans fetched successfully:", result.data);
      return result.data;
    } else {
      console.error("Failed to fetch floor plans:", result.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching floor plans:", error);
    return [];
  }
}

// Create a new floor plan
async function createFloorPlan(floorPlanData) {
  try {
    console.log("Creating floor plan:", floorPlanData);
    
    // Get restaurantId from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('restaurantId');
    
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    // Add restaurantId to the payload
    const payload = {
      ...floorPlanData,
      restaurantId: restaurantId
    };

    console.log("Full payload:", payload);
    
    const token = getAuthToken();
    console.log("Auth token available:", !!token);
    
    // Update the endpoint to match your backend route
    console.log("Sending request to /floorplans endpoint");
    const response = await fetch("/floorplans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    
    console.log("API response status:", response.status);
    console.log("API response headers:", Object.fromEntries([...response.headers]));
    
    const result = await response.json();
    console.log("API response data:", result);
    
    if (response.ok && result.success) {
      console.log("Floor plan created successfully:", result.data);
      return result.data;
    } else {
      console.error("Failed to create floor plan:", result.message);
      throw new Error(result.message || "Failed to create floor plan");
    }
  } catch (error) {
    console.error("Error creating floor plan:", error);
    throw error;
  }
}

// Expose to window object for non-module environments
window.FloorPlanApi = {
  fetchFloorPlans,
  createFloorPlan,
  getAuthToken
};
