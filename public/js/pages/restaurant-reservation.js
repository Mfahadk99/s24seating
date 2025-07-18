/**
 * Restaurant Reservation System
 * Handles the reservation flow for restaurant detail pages
 */

let currentWaitlistData = null;

document.addEventListener("DOMContentLoaded", function () {

  // Dynamically populate shift dropdown
  const shiftSelect = document.getElementById("shift-select");
  const restaurantIdInput = document.getElementById("restaurant-id");
  if (shiftSelect && restaurantIdInput) {
    const restaurantId = restaurantIdInput.value;
    fetch(`/shift/${restaurantId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          // Remove all options except the first one ("All Shifts")
          shiftSelect.innerHTML = '<option value="">All Shifts</option>';
          data.data.forEach(shift => {
            const option = document.createElement("option");
            option.value = shift._id;
            option.textContent = shift.name || shift.label || "Unnamed Shift";
            shiftSelect.appendChild(option);
          });
        }
      })
      .catch(err => {
        console.error("Failed to load shifts:", err);
      });
  }
  
  // Set minimum date to today
  const today = new Date();
  const dateInput = document.getElementById("reservation-date");
  if (dateInput) {
    dateInput.min = today.toISOString().split("T")[0];

    // Load time slots when date changes
    dateInput.addEventListener("change", generateTimeSlots);
  }

  // Format a date for display
  function formatDate(dateString) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  }

  // Format a time for display
  function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Convert hours from format like "9:00 AM" to 24-hour format "09:00"
  function convertTo24Hour(timeStr) {
    if (!timeStr) return null;

    // Handle already 24-hour format
    if (timeStr.indexOf("AM") === -1 && timeStr.indexOf("PM") === -1) {
      return timeStr;
    }

    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours < 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // Generate time slots based on restaurant operating hours
  function generateTimeSlots() {
    const timeSlotSelect = document.getElementById("time-slot");
    if (!timeSlotSelect) return;

    // Clear existing options except the first one
    while (timeSlotSelect.options.length > 1) {
      timeSlotSelect.remove(1);
    }

    // Get restaurant operating hours from the data attributes
    const openTimeStr = document.getElementById("restaurant-open-time").value;
    const closeTimeStr = document.getElementById("restaurant-close-time").value;

    if (!openTimeStr || !closeTimeStr) {
      console.error("Restaurant operating hours not available");
      const errorOption = document.createElement("option");
      errorOption.text = "Operating hours not available";
      errorOption.disabled = true;
      timeSlotSelect.add(errorOption);
      return;
    }

    // Convert to 24-hour format
    const openTime = convertTo24Hour(openTimeStr);
    const closeTime = convertTo24Hour(closeTimeStr);

    if (!openTime || !closeTime) {
      console.error("Invalid operating hours format");
      return;
    }

    // Get selected date
    const selectedDate = new Date(
      document.getElementById("reservation-date").value
    );
    const currentDate = new Date();

    // If selected date is today, use current time as start time if it's after opening time
    let startDate = new Date(selectedDate);
    const [openHour, openMinute] = openTime.split(":").map(Number);
    startDate.setHours(openHour, openMinute, 0, 0);

    // If selected date is today and current time is after opening time, use current time
    if (
      selectedDate.toDateString() === currentDate.toDateString() &&
      currentDate > startDate
    ) {
      startDate = new Date(currentDate);
      // Round up to next 30-minute slot
      const minutes = startDate.getMinutes();
      startDate.setMinutes(minutes + (30 - (minutes % 30)), 0, 0);
    }

    // Create a date object for end time
    const endDate = new Date(selectedDate);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);
    endDate.setHours(closeHour, closeMinute, 0, 0);

    // If end time is before start time, assume it's the next day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    // Generate 30-minute slots
    const timeSlots = [];
    const slotDuration = 30; // minutes
    const currentSlot = new Date(startDate);

    while (currentSlot < endDate) {
      const hours = currentSlot.getHours();
      const minutes = currentSlot.getMinutes();
      const timeValue = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      const displayTime = currentSlot.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      // Only add future time slots
      if (currentSlot > new Date()) {
        timeSlots.push({
          value: timeValue,
          label: displayTime,
        });
      }

      // Add 30 minutes
      currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
    }

    // Add time slots to dropdown
    timeSlots.forEach((slot) => {
      const option = document.createElement("option");
      option.value = slot.value;
      option.text = slot.label;
      timeSlotSelect.add(option);
    });

    // If no slots available, show message
    if (timeSlots.length === 0) {
      const noSlotsOption = document.createElement("option");
      noSlotsOption.text = "No available time slots for today";
      noSlotsOption.disabled = true;
      timeSlotSelect.add(noSlotsOption);
    }
  }

  // Search for available slots
  const searchButton = document.getElementById("search-available-slots");
  if (searchButton) {
    searchButton.addEventListener("click", function () {
      const partySize = document.getElementById("party-size").value;
      const date = document.getElementById("reservation-date").value;
      const timeSlotSelect = document.getElementById("time-slot");
      const time = timeSlotSelect.value;
      const restaurantId = document.getElementById("restaurant-id").value;

      // Hide any previous error messages
      document.getElementById("reservation-search-error").style.display =
        "none";

      // Basic validation
      if (!partySize || !date || !time) {
        document.getElementById("reservation-search-error").textContent =
          "Please select a party size, date, and time slot";
        document.getElementById("reservation-search-error").style.display =
          "block";
        return;
      }

      // Show loading state
      this.textContent = "Searching...";
      this.disabled = true;

      // Construct the query parameters using the new endpoint format
      let queryParams = `restaurantId=${restaurantId}&date=${date}&partySize=${partySize}&time=${time}&isJSON=true`;

      // Fetch available time slots using the new endpoint
      fetch("/reservation/available-slots?" + queryParams, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })
        .then((response) => {
          // Check if we got HTML instead of JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            throw new Error("Error fetching available slots");
          }

          if (!response.ok) {
            return response
              .json()
              .then((err) => {
                throw new Error(
                  err.message || "Failed to fetch available slots"
                );
              })
              .catch((e) => {
                throw new Error(
                  "Error: " + response.status + " " + response.statusText
                );
              });
          }
          return response.json();
        })
        .then((data) => {
          // Reset button state
          this.textContent = "Find Available Tables";
          this.disabled = false;
          console.log(data, "data");

          if (data.success) {
            // Check if there are no tables available
            if (data.message && data.message.includes("No tables available")) {
              const errorContainer = document.getElementById(
                "reservation-search-error"
              );
              errorContainer.innerHTML = `
                            <div class="alert alert-warning">
                                <p>No tables available for this party size. Please try a different party size or date.</p>
                                <button type="button" class="btn btn-outline-info mt-2" onclick="openNotifyModal('${time}', '${date}', ${partySize}, '${restaurantId}')">
                                    <i class="la la-bell mr-1"></i> Notify Me When Available
                                </button>
                            </div>
                        `;
              errorContainer.style.display = "block";
              return;
            }

            // Check if there are no available slots
            if (
              !data.data.availableSlots ||
              data.data.availableSlots.length === 0
            ) {
              const errorContainer = document.getElementById(
                "reservation-search-error"
              );
              errorContainer.innerHTML = `
                            <div class="alert alert-warning">
                                <p>No available time slots found for this selection. Please try a different date or time.</p>
                                <button type="button" class="btn btn-outline-info mt-2" onclick="openNotifyModal('${time}', '${date}', ${partySize}, '${restaurantId}')">
                                    <i class="la la-bell mr-1"></i> Notify Me When Available
                                </button>
                            </div>
                        `;
              errorContainer.style.display = "block";
              return;
            }

            // Update display elements
            document.getElementById("selected-party-size").textContent =
              partySize + (partySize === "1" ? " person" : " people");
            document.getElementById("selected-date-display").textContent =
              formatDate(date);
            document.getElementById("selected-time-display").textContent =
              " around " +
              timeSlotSelect.options[timeSlotSelect.selectedIndex].text;

            // Generate time slot buttons
            const timeSlotContainer = document.getElementById("time-slots");
            timeSlotContainer.innerHTML = "";

            // Check if exact requested time is available
            const requestedTime = time;
            let exactTimeAvailable = false;

            // Display available slots
            data.data.availableSlots.forEach((slotData) => {
              // Create a Date object for the slot time
              const slotStartTime = new Date(slotData.slot.startTime);
              const currentTime = new Date();

              // Only show slots that are in the future
              if (slotStartTime > currentTime) {
                const timeButton = document.createElement("button");
                timeButton.type = "button";
                timeButton.className = "btn btn-outline-primary m-1";

                // Format the time from the slot
                const slotTime = new Date(slotData.slot.startTime);
                const slotHours = slotTime
                  .getHours()
                  .toString()
                  .padStart(2, "0");
                const slotMinutes = slotTime
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                const slotTimeString = `${slotHours}:${slotMinutes}`;

                // Check if this is the exact requested time
                const isExactTime = slotTimeString === requestedTime;
                if (isExactTime) {
                  exactTimeAvailable = true;
                  timeButton.className = "btn btn-primary m-1"; // Highlight the exact time
                }

                // Format display time
                timeButton.textContent = slotTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });

                // Add click handler
                timeButton.onclick = () => openReservationModal(slotData);

                timeSlotContainer.appendChild(timeButton);
              }
            });

            // If no future slots are available, show message
            if (timeSlotContainer.children.length === 0) {
              const noSlotsMessage = document.createElement("div");
              noSlotsMessage.className = "alert alert-warning w-100";
              noSlotsMessage.innerHTML = `
                    <p>No future time slots available for this selection. Please try a different time or date.</p>
                    <button type="button" class="btn btn-outline-info mt-2" onclick="openNotifyModal('${time}', '${date}', ${partySize}, '${restaurantId}')">
                        <i class="la la-bell mr-1"></i> Notify Me When Available
                    </button>
                `;
              timeSlotContainer.appendChild(noSlotsMessage);
            }

            // If exact time is not available, show notify me button
            if (!exactTimeAvailable) {
              const requestedTimeFormatted =
                timeSlotSelect.options[timeSlotSelect.selectedIndex].text;
              const notifyContainer = document.createElement("div");
              notifyContainer.className =
                "mt-3 p-3 bg-light rounded text-center";
              notifyContainer.innerHTML = `
                            <p class="mb-2">Your exact requested time (${requestedTimeFormatted}) is not available.</p>
                            <button type="button" class="btn btn-info waitlist-btn">
                                <i class="la la-bell mr-1"></i> Join Waitlist for ${requestedTimeFormatted}
                            </button>
                        `;
              timeSlotContainer.parentNode.insertBefore(
                notifyContainer,
                timeSlotContainer.nextSibling
              );

              // Add click handler directly
              notifyContainer.querySelector(".waitlist-btn").onclick = () =>
                joinWaitlist(time, date, partySize, restaurantId);
            }

            // Show the available slots container
            document.getElementById("reservation-initial-form").style.display =
              "none";
            document.getElementById("available-slots-container").style.display =
              "block";

            // Update booked count if available
            document.getElementById("booked-count").textContent =
              data.data.totalAvailableSlots || 0;
          } else {
            document.getElementById("reservation-search-error").textContent =
              data.message || "No available slots found";
            document.getElementById("reservation-search-error").style.display =
              "block";
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          this.textContent = "Find Available Tables";
          this.disabled = false;
          let errorMessage = error.message || "Error fetching available slots";

          document.getElementById("reservation-search-error").textContent =
            errorMessage;
          document.getElementById("reservation-search-error").style.display =
            "block";
        });
    });
  }

  // Back to search button
  const backButton = document.getElementById("back-to-search");
  if (backButton) {
    backButton.addEventListener("click", function () {
      document.getElementById("available-slots-container").style.display =
        "none";
      document.getElementById("reservation-initial-form").style.display =
        "block";
    });
  }

  // Open reservation modal with selected time slot
  function openReservationModal(slotData) {
    // Set hidden fields

    const pickOne = slotData?.availableTables[0]?.id;
    console.log(slotData, "slotData")
    document.getElementById("selected-table-id").value = pickOne;
    document.getElementById("selected-start-time").value =
      slotData.slot.startTime;
    document.getElementById("selected-end-time").value = slotData.slot.endTime;
    document.getElementById("selected-slot-id").value = slotData.slot.id;

    // Update modal content
    document.getElementById("modal-party-size").textContent =
      document.getElementById("party-size").value +
      (document.getElementById("party-size").value === "1"
        ? " person"
        : " people");
    document.getElementById("modal-date").textContent = formatDate(
      document.getElementById("reservation-date").value
    );
    document.getElementById("modal-time").textContent = formatTime(
      slotData.slot.startTime
    );

    // Clear any previous messages
    document.getElementById("reservation-error").style.display = "none";
    document.getElementById("reservation-success").style.display = "none";

    // Show the modal
    $("#reservationModal").modal("show");
  }

  // Complete reservation button
  const completeButton = document.getElementById("complete-reservation");
  if (completeButton) {
    completeButton.addEventListener("click", function () {
      // Get form values
      const tableId = document.getElementById("selected-table-id").value;
      const startTime = document.getElementById("selected-start-time").value;
      const endTime = document.getElementById("selected-end-time").value;
      const slotId = document.getElementById("selected-slot-id").value;
      const partySize = parseInt(document.getElementById("party-size").value);
      const name = document.getElementById("contact-name").value;
      const phone = document.getElementById("contact-phone").value;
      const email = document.getElementById("contact-email").value;
      const requests = document.getElementById("special-requests").value;
      const restaurantId = document.getElementById("restaurant-id").value;

      // Basic validation
      if (!name || !phone || !email) {
        document.getElementById("reservation-error").textContent =
          "Please fill in all required fields";
        document.getElementById("reservation-error").style.display = "block";
        return;
      }

      // Disable button while processing
      this.disabled = true;
      this.textContent = "Processing...";



      console.log(tableId, "tableId")
      // Create reservation data
      const reservationData = {
        restaurantId: restaurantId,
        tableId: tableId,
        partySize: partySize,
        slotId: slotId,
        date: document.getElementById("reservation-date").value,
        metadata: {
          name: name,
          phone: phone,
          email: email,
          specialRequests: requests,
        },
      };

      console.log("Sending reservation data:", reservationData);

      // Send the reservation request to the server
      fetch("/reservation?isJSON=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(reservationData),
        credentials: "include",
      })
        .then((response) => {
          // Check if we got HTML instead of JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            throw new Error(
              "Authentication required. Please log in to make a reservation."
            );
          }

          if (!response.ok) {
            return response 
              .json()
              .then((err) => {
                throw new Error(err.message || "Failed to create reservation");
              })
              .catch((e) => {
                throw new Error(
                  "Error: " + response.status + " " + response.statusText
                );
              });
          }
          return response.json();
        })
        .then((data) => {
          // Reset button state
          this.disabled = false;
          this.textContent = "Complete Reservation";

          // Show success message
          document.getElementById("reservation-success").style.display =
            "block";

          // Reset form
          document.getElementById("reservation-confirmation-form").reset();

          // After 3 seconds, close modal and reset the whole reservation flow
          setTimeout(() => {
            $("#reservationModal").modal("hide");
            document.getElementById("available-slots-container").style.display =
              "none";
            document.getElementById("reservation-initial-form").style.display =
              "block";
            document.getElementById("party-size").value = "";
            document.getElementById("reservation-date").value = "";
            document.getElementById("time-slot").value = "";
          }, 3000);
        })
        .catch((error) => {
          console.error("Error:", error);

          // Reset button state
          this.disabled = false;
          this.textContent = "Complete Reservation";

          let errorMessage =
            error.message || "There was an error processing your reservation.";

          // Check if this might be an authentication error
          if (
            errorMessage.includes("Authentication required") ||
            error.message.includes("401")
          ) {
            errorMessage =
              "You need to be logged in to make a reservation. Please log in and try again.";
          }

          document.getElementById("reservation-error").textContent =
            errorMessage;
          document.getElementById("reservation-error").style.display = "block";
        });
    });
  }

  // Gallery image click (for demo)
  const galleryItems = document.querySelectorAll(".gallery-item");
  galleryItems.forEach((item) => {
    item.addEventListener("click", function () {
      const imgSrc = this.querySelector("img").src;
      // In a real implementation, you might open a lightbox here
      alert("Image gallery functionality would open a lightbox here");
    });
  });

  // Generate time slots on page load
  generateTimeSlots();
});

function submitNotification() {
  // Get form values
  const name = document.getElementById("notify-name").value;
  const email = document.getElementById("notify-email").value;
  const phone = document.getElementById("notify-phone").value;

  // Get data from modal
  const modal = document.getElementById("notifyModal");
  const time = modal.dataset.time;
  const date = modal.dataset.date;
  const partySize = parseInt(modal.dataset.partySize);
  const restaurantId = modal.dataset.restaurantId;

  // Basic validation
  if (!name || !email) {
    document.getElementById("notify-error").textContent =
      "Please fill in all required fields";
    document.getElementById("notify-error").style.display = "block";
    return;
  }

  // Disable button while processing
  const submitButton = document.getElementById("submit-notification");
  submitButton.disabled = true;
  submitButton.textContent = "Processing...";

  // Calculate waiting time in minutes
  const calculateWaitingTime = () => {
    const [hours, minutes] = time.split(":").map(Number);
    const requestedTime = new Date(date);
    requestedTime.setHours(hours, minutes, 0, 0);

    const currentTime = new Date();

    // If requested time is earlier than current time, assume it's for the next available day
    if (requestedTime < currentTime) {
      requestedTime.setDate(requestedTime.getDate() + 1);
    }

    const diffInMinutes = Math.round(
      (requestedTime - currentTime) / (1000 * 60)
    );
    return Math.max(0, diffInMinutes); // Ensure we don't return negative waiting time
  };

  // Create waitlist entry data
  const waitlistData = {
    restaurantId: restaurantId,
    userId: "guest_user", // You might want to get this from your auth system if user is logged in
    partySize: partySize,
    waitingTime: calculateWaitingTime(),
    guestInfo: {
      name: name,
      email: email,
      phone: phone || null,
    },
  };

  console.log("Sending waitlist request:", waitlistData);

  // Send the waitlist request to the server
  fetch("/waitlist?isJSON=true", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(waitlistData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.message || "Failed to join waitlist");
        });
      }
      return response.json();
    })
    .then((data) => {
      // Show success message
      document.getElementById("notify-success").style.display = "block";
      document.getElementById("notify-success").textContent =
        `You've been added to the waitlist! We'll notify you when a table becomes available.`;

      // Reset form
      document.getElementById("notify-form").reset();

      // Close modal after 3 seconds
      setTimeout(() => {
        $("#notifyModal").modal("hide");
      }, 3000);
    })
    .catch((error) => {
      console.error("Error:", error);

      // Show error message
      document.getElementById("notify-error").textContent =
        error.message || "Failed to join waitlist. Please try again.";
      document.getElementById("notify-error").style.display = "block";
    })
    .finally(() => {
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = "Submit";
    });
}

function openNotifyModal(time, date, partySize, restaurantId) {
  console.log("Opening notify modal with:", {
    time,
    date,
    partySize,
    restaurantId,
  }); // Debug log

  // Create modal if it doesn't exist
  if (!document.getElementById("notifyModal")) {
    const modalHTML = `
            <div class="modal fade" id="notifyModal" tabindex="-1" role="dialog" aria-labelledby="notifyModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="notifyModalLabel">Join Waitlist</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="waitlist-info mb-4">
                                <h6>Requested Reservation Details</h6>
                                <p class="mb-1"><i class="la la-users mr-2"></i> Party of <span id="modal-party-size"></span></p>
                                <p class="mb-1"><i class="la la-calendar mr-2"></i> <span id="modal-date"></span></p>
                                <p class="mb-3"><i class="la la-clock-o mr-2"></i> <span id="modal-time"></span></p>
                                <div class="alert alert-info">
                                    <i class="la la-info-circle mr-2"></i>
                                    We'll add you to our waitlist and notify you if a table becomes available at your requested time.
                                </div>
                            </div>
                            <form id="notify-form">
                                <div class="form-group">
                                    <label for="notify-name">Name *</label>
                                    <input type="text" class="form-control" id="notify-name" placeholder="Your name" required>
                                </div>
                                <div class="form-group">
                                    <label for="notify-email">Email *</label>
                                    <input type="email" class="form-control" id="notify-email" placeholder="Your email" required>
                                </div>
                                <div class="form-group">
                                    <label for="notify-phone">Phone (optional)</label>
                                    <input type="tel" class="form-control" id="notify-phone" placeholder="Your phone number">
                                    <small class="form-text text-muted">We'll use this to send you SMS updates if provided.</small>
                                </div>
                                <div id="notify-error" class="alert alert-danger" style="display: none;"></div>
                                <div id="notify-success" class="alert alert-success" style="display: none;"></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" id="submit-notification" class="btn btn-primary">
                                <i class="la la-bell mr-1"></i> Join Waitlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add event listener to submit button
    document
      .getElementById("submit-notification")
      .addEventListener("click", submitNotification);
  }

  // Store data in the modal for later use
  const modal = document.getElementById("notifyModal");
  modal.dataset.time = time;
  modal.dataset.date = date;
  modal.dataset.partySize = partySize;
  modal.dataset.restaurantId = restaurantId;

  // Update modal content with reservation details
  document.getElementById("modal-party-size").textContent =
    `${partySize} ${parseInt(partySize) === 1 ? "person" : "people"}`;
  document.getElementById("modal-date").textContent = formatDate(date);

  // Format time for display
  const timeDisplay = new Date(`2000-01-01T${time}`).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
  document.getElementById("modal-time").textContent = timeDisplay;

  // Clear previous messages
  document.getElementById("notify-error").style.display = "none";
  document.getElementById("notify-success").style.display = "none";

  // Clear form if it exists
  const form = document.getElementById("notify-form");
  if (form) form.reset();

  // Show the modal using jQuery
  $("#notifyModal").modal("show");
}

// Add this to ensure jQuery and Bootstrap are ready
$(document).ready(function () {
  // Initialize any Bootstrap components
  $('[data-toggle="tooltip"]').tooltip();

  // Handle modal cleanup on close
  $("#notifyModal").on("hidden.bs.modal", function () {
    document.getElementById("notify-error").style.display = "none";
    document.getElementById("notify-success").style.display = "none";
    document.getElementById("notify-form").reset();
  });
});

// Function to handle joining waitlist
function joinWaitlist(time, date, partySize, restaurantId) {
  // Store data for later use
  currentWaitlistData = { time, date, partySize, restaurantId };

  // Format time for display
  const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );

  // Format date for display
  const displayDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Update modal content
  document.getElementById("waitlist-time").textContent = displayTime;
  document.getElementById("waitlist-date").textContent = displayDate;
  document.getElementById("waitlist-party-size").textContent =
    `${partySize} ${parseInt(partySize) === 1 ? "person" : "people"}`;

  // Clear previous messages and form
  document.getElementById("waitlist-error").style.display = "none";
  document.getElementById("waitlist-success").style.display = "none";
  document.getElementById("waitlist-form").reset();

  // Show modal
  $("#waitlistModal").modal("show");
}

// Function to submit waitlist entry
function submitWaitlistEntry() {
  const name = document.getElementById("waitlist-name").value;
  const email = document.getElementById("waitlist-email").value;
  const phone = document.getElementById("waitlist-phone").value;

  // Validate required fields
  if (!name || !email) {
    document.getElementById("waitlist-error").textContent =
      "Please fill in all required fields";
    document.getElementById("waitlist-error").style.display = "block";
    return;
  }

  // Calculate waiting time
  const requestedTime = new Date(currentWaitlistData.date);
  const [hours, minutes] = currentWaitlistData.time.split(":");
  requestedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const currentTime = new Date();
  const waitingTime = Math.max(
    0,
    Math.round((requestedTime - currentTime) / (1000 * 60))
  );

  // Prepare waitlist data
  const waitlistData = {
    restaurantId: currentWaitlistData.restaurantId,
    userId: "guest_user",
    partySize: parseInt(currentWaitlistData.partySize),
    waitingTime: waitingTime,
    guestInfo: {
      name: name,
      email: email,
      phone: phone || null,
    },
  };

  // Disable submit button
  const submitButton = document.getElementById("submit-waitlist");
  submitButton.disabled = true;
  submitButton.innerHTML =
    '<i class="la la-spinner la-spin"></i> Processing...';

  // Submit to server
  fetch("/waitlist?isJSON=true", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(waitlistData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("waitlist-success").textContent =
          "You have been added to the waitlist. We will notify you when a table becomes available.";
        document.getElementById("waitlist-success").style.display = "block";

        // Close modal after 2 seconds
        setTimeout(() => {
          $("#waitlistModal").modal("hide");
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to join waitlist");
      }
    })
    .catch((error) => {
      document.getElementById("waitlist-error").textContent =
        error.message || "An error occurred. Please try again.";
      document.getElementById("waitlist-error").style.display = "block";
    })
    .finally(() => {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.innerHTML = "Join Waitlist";
    });
}

// Initialize event handlers when document is ready
$(document).ready(function () {
  // Handle waitlist submission
  document
    .getElementById("submit-waitlist")
    .addEventListener("click", submitWaitlistEntry);

  // Handle modal cleanup
  $("#waitlistModal").on("hidden.bs.modal", function () {
    document.getElementById("waitlist-error").style.display = "none";
    document.getElementById("waitlist-success").style.display = "none";
    document.getElementById("waitlist-form").reset();
    currentWaitlistData = null;
  });
});
