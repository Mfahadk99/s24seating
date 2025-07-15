import Reservation from "../models/reservation.schema";
import {
  handleResponse,
  handleError,
  handleRedirect,
} from "../utils/responseHandler";
import TableElement from "../models/table.model";
import Restaurant from "../models/restaurant.model";
// import TimeSlot from "../models/timeSlot.model";
import { Menu } from "../modules/menu";
import Shift from "../models/shift"; // Added import for Shift
import { Request, Response } from "express";

export const createReservation = async (req, res) => {
  try {
    const { restaurantId, tableId, userId, partySize, slotId, date, metadata } =
      req.body;

    if (!slotId || !date) {
      return handleError(req, res, 400, "Slot ID and date are required");
    }

    // Get time slot details
    const timeSlot = await TimeSlot.findById(slotId);
    if (!timeSlot) {
      return handleError(req, res, 404, "Time slot not found");
    }

    // ✅ Fix: Parse date properly
    const reservationDate = new Date(date + "T00:00:00.000Z"); // Force UTC
    const [hours, minutes] = timeSlot.value.split(":").map(Number);

    // ✅ Fix: Set start time using the correct date
    const startTime = new Date(reservationDate);
    startTime.setHours(hours, minutes, 0, 0);

    // ✅ Fix: Calculate end time using slot duration
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + timeSlot.duration);

    // ✅ Debug logging
    console.log("Reservation Time Calculation:", {
      requestDate: date,
      parsedDate: reservationDate.toISOString(),
      slotValue: timeSlot.value,
      slotDuration: timeSlot.duration,
      calculatedStartTime: startTime.toISOString(),
      calculatedEndTime: endTime.toISOString(),
    });

    // Allow guest reservations
    let actualUserId = userId;
    if (req.user && req.user._id) {
      actualUserId = req.user._id;
    } else if (!userId) {
      actualUserId = "guest_user";
    }

    // Check if table exists
    const table = await TableElement.findById(tableId);
    if (!table) {
      return handleError(req, res, 404, "Table not found");
    }

    // ✅ Fix: Better conflict check with proper date range
    const dayStart = new Date(reservationDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(reservationDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingReservation = await Reservation.findOne({
      tableId,
      status: { $ne: "cancelled" },
      // ✅ Check within the same day and time overlap
      date: { $gte: dayStart, $lt: dayEnd },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    console.log("Conflict Check:", {
      tableId,
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString(),
      newStartTime: startTime.toISOString(),
      newEndTime: endTime.toISOString(),
      existingReservation: existingReservation
        ? {
            id: existingReservation._id,
            startTime: existingReservation.startTime,
            endTime: existingReservation.endTime,
          }
        : null,
    });

    if (existingReservation) {
      return handleError(
        req,
        res,
        400,
        "Table is already reserved for this time"
      );
    }

    // Update table status
    await TableElement.findByIdAndUpdate(tableId, { isReserved: true });

    // Create reservation
    const reservation = new Reservation({
      restaurantId,
      tableId,
      userId: actualUserId,
      partySize,
      startTime,
      endTime,
      status: "pending",
      metadata,
      slotId,
      date: reservationDate,
    });

    await reservation.save();

    // ✅ Debug final saved data
    console.log("Reservation Saved:", {
      id: reservation._id,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    });

    if (req.query.isJSON === "true") {
      return handleResponse(req, res, 201, {
        success: true,
        message: "Reservation created successfully",
        data: reservation,
      });
    } else {
      const menuInstance = new Menu();
      return res.render("reservations/detail", {
        reservation: reservation,
        title: "Reservation Created",
        menu: menuInstance.client,
        // currentUser: req.user || {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  } catch (error) {
    console.error("Reservation error:", error);
    if (req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error creating reservation");
    } else {
      return res.render("reservations/detail", {
        reservation: null,
        error: "Failed to create reservation",
        title: "Reservation Error",
        // currentUser: req.user || {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  }
};

export const getReservation = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const reservation = await Reservation.findById(reservationId)
      .populate("tableId", "name tableId capacity")
      .populate("restaurantId", "name location")
      .populate("slotId", "value duration label"); // Added slot details

      console.log("reservation controller", req);
    if (!reservation) {
      if (req.query.isJSON === "true") {
        return handleError(req, res, 404, "Reservation not found");
      } else {
        return res.render("reservations/detail", {
          reservation: null,
          error: "Reservation not found",
          title: "Reservation Not Found",
          // currentUser: req.user || {
          //   firstname: "Guest",
          //   lastname: "User",
          //   image_url: "/public/images/default-profile.png",
          // },
        });
      }
    }

    if (req.query.isJSON === "true") {
      return handleResponse(req, res, 200, {
        success: true,
        message: "Reservation retrieved successfully",
        data: reservation,
      });
    } else {
      const menuInstance = new Menu();
      return res.render("reservations/detail", {
        reservation: reservation,
        title: "Reservation Details",
        menu: menuInstance.client,
        // currentUser: req.user || {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  } catch (error) {
    console.error("Reservation error:", error);
    if (req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error retrieving reservation");
    } else {
              return res.render("reservations/detail", {
          reservation: null,
          error: "Failed to load reservation",
          title: "Reservation Error",
          // currentUser: req.user || {
          //   firstname: "Guest",
          //   lastname: "User",
          //   image_url: "/public/images/default-profile.png",
          // },
        });
    }
  }
};

export const getAllReservations = async (req, res) => {
  try {
    const { restaurantId, status, date, customerId, userId, filter, shift } =
      req.query;

    console.log("reservation controller", res.locals.currentUser);

    if (!restaurantId) {
      if (req.query.isJSON === "true") {
        return handleError(req, res, 400, "Restaurant ID is required");
      } else {
        return res.render("reservations/index", {
          reservations: [],
          error: "Restaurant ID is required",
          title: "Reservations List Error",
          // currentUser: req.user || {
          //   firstname: "Guest",
          //   lastname: "User",
          //   image_url: "/public/images/default-profile.png",
          // },
        });
      }
    }

    // Build filter object
    const baseFilter: any = { restaurantId };
    const currentTime = new Date();

    // Add status filter if provided
    if (status) baseFilter.status = status;
    if (userId) baseFilter.userId = userId;

    // Add date filter if provided
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);

      // ✅ Use date field instead of createdAt
      baseFilter.date = { $gte: startDate, $lte: endDate };
    }

    // Apply specific filters based on the filter parameter
    let finalFilter = { ...baseFilter };
    switch (filter) {
      case "finished":
        // Completed reservations
        finalFilter = {
          ...baseFilter,
          status: "finished",
        };
        break;
      case "removed":
        // Removed/cancelled reservations
        finalFilter = {
          ...baseFilter,
          status: "removed",
        };
        break;
      case "seated":
        // Currently seated reservations
        finalFilter = {
          ...baseFilter,
          status: "seated",
        };
        break;
      case "pending":
        // Pending reservations
        finalFilter = {
          ...baseFilter,
          status: "pending",
        };
        break;
      default:
        // If no specific filter, use the baseFilter with any provided status
        if (status) {
          finalFilter = { ...baseFilter };
        }
    }

    // Find all active reservations for this restaurant
    const activeReservations = await Reservation.find({
      restaurantId,
      status: { $in: ["seated", "pending"] }, // Updated to use new status values
      startTime: { $lte: currentTime },
      endTime: { $gt: currentTime },
    }).select("tableId");

    // Get all reserved table IDs
    const reservedTableIds = activeReservations.map((res) => res.tableId);

    // Update all tables for this restaurant
    await TableElement.updateMany({ restaurantId }, { isReserved: false });

    if (reservedTableIds.length > 0) {
      await TableElement.updateMany(
        { _id: { $in: reservedTableIds } },
        { isReserved: true }
      );
    }

    // Get reservations with populated data
    let reservations = await Reservation.find(finalFilter)
      .sort({ startTime: -1 })
      .populate(
        "tableId",
        "name tableId capacity status isReserved seats tableType"
      )
      .populate("restaurantId", "name location")
      .populate("slotId", "value duration label");

    // Apply shift filtering if provided
    if (shift) {
      const Shift = require("../models/shift");
      
      // Get shift data based on shift parameter
      const shiftData = await Shift.findOne({
        restaurantId,
        $or: [
          { name: { $regex: new RegExp(shift, "i") } },
          { day: { $regex: new RegExp(shift, "i") } }
        ]
      });

      if (shiftData) {
        // Filter reservations based on shift time range
        reservations = reservations.filter(reservation => {
          if (!reservation.startTime) return false;
          
          const reservationTime = new Date(reservation.startTime);
          const [shiftStartHour, shiftStartMinute] = shiftData.startTime.split(':').map(Number);
          const [shiftEndHour, shiftEndMinute] = shiftData.endTime.split(':').map(Number);
          
          const shiftStart = new Date(reservationTime);
          shiftStart.setHours(shiftStartHour, shiftStartMinute, 0, 0);
          
          const shiftEnd = new Date(reservationTime);
          shiftEnd.setHours(shiftEndHour, shiftEndMinute, 0, 0);
          
          return reservationTime >= shiftStart && reservationTime <= shiftEnd;
        });
      }
    }

    // Add a computed status for UI display
    const reservationsWithStatus = reservations.map((reservation) => {
      const res = reservation.toObject();
      res.computedStatus = res.status; // Use the actual status directly since it matches the UI states
      return res;
    });

    if (req.query.isJSON === "true") {
      return handleResponse(req, res, 200, {
        success: true,
        message: "Reservations retrieved successfully",
        count: reservationsWithStatus.length,
        data: reservationsWithStatus,
      });
    } else {
      const menuInstance = new Menu();
      return res.render("reservations/index", {
        reservations: reservationsWithStatus,
        title: "Reservations",
        menu: menuInstance.client,
        restaurantId: restaurantId,
        activeFilter: filter || "all",
        // currentUser: req.user || {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  } catch (error) {
    console.error("Get all reservations error:", error);
    if (req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error retrieving reservations");
    } else {
      return res.render("reservations/index", {
        reservations: [],
        error: "Failed to load reservations",
        title: "Reservations List Error",
        // currentUser: req.user || {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  }
};

// Delete a reservation
export const deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      if (req.query.isJSON === "true") {
        return handleError(req, res, 404, "Reservation not found");
      } else {
        return res.render("reservations/detail", {
          reservation: null,
          error: "Reservation not found",
          title: "Delete Error",
          // currentUser: req.user || {
          //   firstname: "Guest",
          //   lastname: "User",
          //   image_url: "/public/images/default-profile.png",
          // },
        });
      }
    }

    // Update table's isReserved status
    if (reservation.tableId) {
      await TableElement.findByIdAndUpdate(reservation.tableId, {
        isReserved: false,
      });
    }

    // Delete the reservation
    await Reservation.findByIdAndDelete(reservationId);

    if (req.query.isJSON === "true") {
      return handleResponse(req, res, 200, {
        success: true,
        message: "Reservation deleted successfully",
      });
    } else {
      // Redirect to reservations list with success message
      return res.redirect("/reservations?success=deleted");
    }
  } catch (error) {
    console.error("Delete reservation error:", error);
    if (req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error deleting reservation");
    } else {
      return res.render("reservations/detail", {
        reservation: null,
        error: "Failed to delete reservation",
        title: "Delete Error",
        // currentUser: req.user || {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  }
};

// Update a reservation
export const updateReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { partySize, slotId, date, tableId, status, metadata } = req.body;

    // Find existing reservation
    const existingReservation = await Reservation.findById(reservationId);

    if (!existingReservation) {
      if (req.query.isJSON === "true") {
        return handleError(req, res, 404, "Reservation not found");
      } else {
        return res.render("reservations/detail", {
          reservation: null,
          error: "Reservation not found",
          title: "Update Error",
          // currentUser: req.user || {
          //   firstname: "Guest",
          //   lastname: "User",
          //   image_url: "/public/images/default-profile.png",
          // },
        });
      }
    }

    // If slot or date is changing, recalculate times
    let startTime = existingReservation.startTime;
    let endTime = existingReservation.endTime;
    let newSlotId = existingReservation.slotId;
    let newDate = existingReservation.date;

    if (slotId && date) {
      // Get time slot details
      const timeSlot = await TimeSlot.findById(slotId);
      if (!timeSlot) {
        if (req.query.isJSON === "true") {
          return handleError(req, res, 404, "Time slot not found");
        } else {
          return res.render("reservations/detail", {
            reservation: existingReservation,
            error: "Time slot not found",
            title: "Update Error",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }

      // Parse the date and time
      newDate = new Date(date);
      const [hours, minutes] = timeSlot.value.split(":").map(Number);

      // Set start time
      startTime = new Date(newDate);
      startTime.setHours(hours, minutes, 0, 0);

      // Calculate end time using slot duration
      endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + timeSlot.duration);
      newSlotId = timeSlot._id;
    }

    // If table is changing or time is changing, check for conflicts
    if (tableId || (slotId && date)) {
      const tableToCheck = tableId || existingReservation.tableId;

      // Check if table exists
      const table = await TableElement.findById(tableToCheck);
      if (!table) {
        if (req.query.isJSON === "true") {
          return handleError(req, res, 404, "Table not found");
        } else {
          return res.render("reservations/detail", {
            reservation: existingReservation,
            error: "Table not found",
            title: "Update Error",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }

      // Check if table is already reserved by another reservation
      const conflictingReservation = await Reservation.findOne({
        _id: { $ne: reservationId }, // Exclude current reservation
        tableId: tableToCheck,
        status: { $ne: "cancelled" },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
      });

      if (conflictingReservation) {
        if (req.query.isJSON === "true") {
          return handleError(
            req,
            res,
            400,
            "Table is already reserved for this time"
          );
        } else {
          return res.render("reservations/detail", {
            reservation: existingReservation,
            error: "Table is already reserved for this time",
            title: "Update Error",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }

      // If changing tables, update old and new table status
      if (tableId && tableId !== existingReservation.tableId.toString()) {
        // Set old table as not reserved
        await TableElement.findByIdAndUpdate(existingReservation.tableId, {
          isReserved: false,
        });

        // Set new table as reserved
        await TableElement.findByIdAndUpdate(tableId, {
          isReserved: true,
        });
      }
    }

    // Update reservation
    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      {
        $set: {
          ...(partySize && { partySize }),
          ...(tableId && { tableId }),
          ...(status && { status }),
          ...(metadata && { metadata }),
          startTime,
          endTime,
          slotId: newSlotId,
          date: newDate,
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate("tableId", "name tableId capacity")
      .populate("restaurantId", "name location")
      .populate("slotId", "value duration label");

    if (req.query.isJSON === "true") {
      return handleResponse(req, res, 200, {
        success: true,
        message: "Reservation updated successfully",
        data: updatedReservation,
      });
    } else {
      const menuInstance = new Menu();
      return res.render("reservations/detail", {
        reservation: updatedReservation,
        title: "Reservation Updated",
        menu: menuInstance.client,
        success: "Reservation updated successfully",
        // currentUser: req.user || {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  } catch (error) {
    // console.error("Update reservation error:", error);
    // if (req.query.isJSON === "true") {
    //   return handleError(req, res, 500, "Error updating reservation");
    // } else {
    //   return res.render("reservations/detail", {
    //     reservation: null,
    //     error: "Failed to update reservation",
    //     title: "Update Error",
    //     currentUser: {
    //       firstname: "Guest",
    //       lastname: "User",
    //       image_url: "/public/images/default-profile.png",
    //     },
    //   });
    // }
  }
};

// Get available time slots for a restaurant on a specific date
export const getAvailableTimeSlots = async (req, res) => {
  try {
    console.log("=== getAvailableTimeSlots called ===");
    console.log("Query Parameters:", req.query);
    console.log("isJSON value:", req.query.isJSON);
    console.log("isJSON type:", typeof req.query.isJSON);

    const { restaurantId, date, partySize, time } = req.query;
    console.log("Destructured values:", {
      restaurantId,
      date,
      partySize,
      time,
    });

    // Validate required parameters
    if (!restaurantId || !date || !partySize) {
      if (req.query.isJSON) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required parameters: restaurantId, date, and partySize are required",
        });
      } else {
        if (req.query.isJSON === "true") {
          return handleError(
            req,
            res,
            400,
            "Missing required parameters: restaurantId, date, and partySize are required"
          );
        } else {
          return res.render("reservations/time-slots", {
            error:
              "Missing required parameters: restaurantId, date, and partySize are required",
            title: "Available Time Slots",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }
    }

    // Get the restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      if (req.query.isJSON == "true") {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      } else {
        if (req.query.isJSON === "true") {
          return handleError(req, res, 404, "Restaurant not found");
        } else {
          return res.render("reservations/time-slots", {
            error: "Restaurant not found",
            title: "Available Time Slots",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }
    }

    // Parse the selected date
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    // Set up date range for the selected date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find available shifts for the restaurant and day
    const availableShifts = await Shift.find({
      restaurantId,
      active: true,
      $or: [
        { day: dayOfWeek },
        { day: { $exists: false } }, // Include shifts without specific day restriction
      ],
    }).sort({ startTime: 1 });

    if (availableShifts.length === 0) {
      const message = `No shifts available for ${dayOfWeek}`;
      if (req.query.isJSON) {
        return res.status(200).json({
          success: true,
          message,
          data: { shifts: [], timeSlots: [], tables: [] },
        });
      } else {
        if (req.query.isJSON === "true") {
          return handleResponse(req, res, 200, {
            success: true,
            message,
            data: { shifts: [], timeSlots: [], tables: [] },
          });
        } else {
          return res.render("reservations/time-slots", {
            shifts: [],
            timeSlots: [],
            tables: [],
            message,
            title: "Available Time Slots",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }
    }

    // If specific time is provided, filter shifts that contain that time
    let filteredShifts = availableShifts;
    if (time) {
      const requestedTime = time; // Expected format: "18:00"
      filteredShifts = availableShifts.filter((shift) => {
        const shiftStart = timeToMinutes(shift.startTime);
        const shiftEnd = timeToMinutes(shift.endTime);
        const requestedMinutes = timeToMinutes(requestedTime);
        return requestedMinutes >= shiftStart && requestedMinutes < shiftEnd;
      });

      if (filteredShifts.length === 0) {
        const message = `No shifts available for the requested time ${time}`;
        if (req.query.isJSON) {
          return res.status(200).json({
            success: true,
            message,
            data: { shifts: [], timeSlots: [], tables: [] },
          });
        } else {
          if (req.query.isJSON === "true") {
            return handleResponse(req, res, 200, {
              success: true,
              message,
              data: { shifts: [], timeSlots: [], tables: [] },
            });
          } else {
            return res.render("reservations/time-slots", {
              shifts: [],
              timeSlots: [],
              tables: [],
              message,
              title: "Available Time Slots",
              // currentUser: {
              //   firstname: "Guest",
              //   lastname: "User",
              //   image_url: "/public/images/default-profile.png",
              // },
            });
          }
        }
      }
    }

    // Get time slots for the filtered shifts
    const shiftIds = filteredShifts.map((shift) => shift._id);
    let timeSlots = await TimeSlot.find({
      restaurantId,
      shiftId: { $in: shiftIds },
    }).sort({ order: 1 });

    // If specific time is provided, filter time slots around that time
    if (time) {
      const requestedMinutes = timeToMinutes(time);

      // First sort all slots by their time
      timeSlots.sort((a, b) => {
        const aMinutes = timeToMinutes(a.value);
        const bMinutes = timeToMinutes(b.value);
        return aMinutes - bMinutes;
      });

      // Find the index of closest time slot to requested time
      const closestSlotIndex = timeSlots.reduce((closest, slot, index) => {
        const slotMinutes = timeToMinutes(slot.value);
        const currentDiff = Math.abs(slotMinutes - requestedMinutes);
        const closestDiff = Math.abs(
          timeToMinutes(timeSlots[closest].value) - requestedMinutes
        );

        return currentDiff < closestDiff ? index : closest;
      }, 0);

      // Get 2 slots before and 2 slots after the closest slot
      const startIndex = Math.max(0, closestSlotIndex - 2);
      const endIndex = Math.min(timeSlots.length - 1, closestSlotIndex + 2);
      timeSlots = timeSlots.slice(startIndex, endIndex + 1);

      // Add a flag to indicate if this is the exact requested time
      timeSlots = timeSlots.map((slot) => ({
        ...slot.toObject(),
        isRequestedTime: timeToMinutes(slot.value) === requestedMinutes,
      }));
    }

    if (timeSlots.length === 0) {
      const message = time
        ? `No time slots available around ${time}`
        : "No time slots available for the selected shifts";

      if (req.query.isJSON) {
        return res.status(200).json({
          success: true,
          message,
          data: { shifts: filteredShifts, timeSlots: [], tables: [] },
        });
      } else {
        if (req.query.isJSON === "true") {
          return handleResponse(req, res, 200, {
            success: true,
            message,
            data: { shifts: filteredShifts, timeSlots: [], tables: [] },
          });
        } else {
          return res.render("reservations/time-slots", {
            shifts: filteredShifts,
            timeSlots: [],
            tables: [],
            message,
            title: "Available Time Slots",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }
    }

    // Find tables suitable for the party size
    const suitableTables = await TableElement.find({
      restaurantId,
      status: "active",
      "capacity.minParty": { $lte: parseInt(partySize) },
      "capacity.maxParty": { $gte: parseInt(partySize) },
    });

    if (suitableTables.length === 0) {
      const message = `No tables available for party size of ${partySize}`;
      if (req.query.isJSON) {
        return res.status(200).json({
          success: true,
          message,
          data: { shifts: filteredShifts, timeSlots, tables: [] },
        });
      } else {
        if (req.query.isJSON === "true") {
          return handleResponse(req, res, 200, {
            success: true,
            message,
            data: { shifts: filteredShifts, timeSlots, tables: [] },
          });
        } else {
          return res.render("reservations/time-slots", {
            shifts: filteredShifts,
            timeSlots,
            tables: [],
            message,
            title: "Available Time Slots",
            // currentUser: {
            //   firstname: "Guest",
            //   lastname: "User",
            //   image_url: "/public/images/default-profile.png",
            // },
          });
        }
      }
    }

    // Get existing reservations for the selected date
    const existingReservations = await Reservation.find({
      restaurantId,
      // ✅ Fix: Use proper date range for the selected date
      $or: [
        // Method 1: Check by date field
        { date: { $gte: startOfDay, $lt: endOfDay } },
        // Method 2: Check by startTime/endTime (for backward compatibility)
        {
          startTime: { $gte: startOfDay, $lt: endOfDay },
          endTime: { $gte: startOfDay, $lt: endOfDay },
        },
      ],
      status: { $in: ["confirmed", "pending"] },
    }).populate("slotId", "value duration");

    // ✅ Enhanced debug logging
    console.log("=== AVAILABILITY DEBUG ===");
    console.log("Selected Date:", selectedDate.toISOString());
    console.log("Start of Day:", startOfDay.toISOString());
    console.log("End of Day:", endOfDay.toISOString());
    console.log(
      "Existing Reservations:",
      existingReservations.map((r) => ({
        id: r._id,
        tableId: r.tableId,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
      }))
    );

    existingReservations.forEach((res, index) => {
      console.log(`Reservation ${index + 1}:`, {
        id: res._id,
        tableId: res.tableId,
        date: res.date,
        startTime: res.startTime,
        endTime: res.endTime,
        slotValue: res.slotId?.value,
      });
    });

    // Check availability for each time slot and table combination
    const availabilityData = timeSlots.map((slot) => {
      const [hour, minute] = slot.value.split(":").map(Number);
      const slotStartTime = new Date(selectedDate);
      slotStartTime.setHours(hour, minute, 0, 0);

      const slotEndTime = new Date(slotStartTime);
      slotEndTime.setMinutes(slotStartTime.getMinutes() + slot.duration);

      // Find available tables for this time slot
      const availableTables = suitableTables.filter((table) => {
        const isReserved = existingReservations.some((reservation) => {
          console.log("Checking reservation:", {
            reservationId: reservation._id,
            reservationTableId: reservation.tableId,
            currentTableId: table._id,
            reservationStart: reservation.startTime,
            reservationEnd: reservation.endTime,
            slotStart: slotStartTime,
            slotEnd: slotEndTime,
          });

          // ✅ Proper null checks
          if (!reservation.startTime || !reservation.endTime) {
            console.warn(`Reservation ${reservation._id} missing time data`);
            return false;
          }

          const reservationStart = new Date(reservation.startTime);
          const reservationEnd = new Date(reservation.endTime);

          // Check if table is the same and times overlap
          const tableMatch =
            reservation.tableId.toString() === table._id.toString();
          const timeOverlap =
            slotStartTime < reservationEnd && slotEndTime > reservationStart;

          if (tableMatch && timeOverlap) {
            console.log(
              `Table ${table.tableId} is reserved during slot ${slot.value}`
            );
          }

          return tableMatch && timeOverlap;
        });

        return !isReserved;
      });

      return {
        slot: {
          id: slot._id,
          label: slot.label,
          value: slot.value,
          startTime: slotStartTime.toISOString(),
          endTime: slotEndTime.toISOString(),
          duration: slot.duration,
          bufferTime: slot.bufferTime,
          shiftId: slot.shiftId,
        },
        availableTables: availableTables.map((table) => ({
          id: table._id,
          tableId: table.tableId,
          name: table.name,
          seats: table.seats,
          capacity: table.capacity,
          tableType: table.tableType,
          isReserved: false,
        })),
        isAvailable: availableTables.length > 0,
      };
    });

    // Filter out time slots with no available tables
    const availableSlots = availabilityData.filter((item) => item.isAvailable);

    const responseData = {
      date: selectedDate.toISOString(),
      dayOfWeek,
      partySize: parseInt(partySize),
      requestedTime: time || null,
      shifts: filteredShifts.map((shift) => ({
        id: shift._id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        duration: shift.duration,
        bufferTime: shift.bufferTime,
      })),
      availableSlots,
      totalAvailableSlots: availableSlots.length,
      totalSuitableTables: suitableTables.length,
    };

    console.log("isJSON value:", req.query.isJSON);
    console.log("isJSON type:", typeof req.query.isJSON);

    if (req.query.isJSON == "true") {
      return res.status(200).json({
        success: true,
        message: "Available time slots retrieved successfully",
        data: responseData,
      });
    } else {
      console.log("Found available slots:", availableSlots.length);
      return res.render("reservations/time-slots", {
        ...responseData,
        title: "Available Time Slots",
        // currentUser: {
        //   firstname: "Guest",
        //   lastname: "User",
        //   image_url: "/public/images/default-profile.png",
        // },
      });
    }
  } catch (error) {
    console.error("Error getting available time slots:", error);

    if (req.query.isJSON) {
      return res.status(500).json({
        success: false,
        message: "Error retrieving available time slots",
        error: error.message,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleError(
          req,
          res,
          500,
          "Error retrieving available time slots"
        );
      } else {
        return res.render("reservations/time-slots", {
          error: "Failed to load available time slots",
          title: "Available Time Slots",
          // currentUser: {
          //   firstname: "Guest",
          //   lastname: "User",
          //   image_url: "/public/images/default-profile.png",
          // },
        });
      }
    }
  }
};

// Helper function to convert time string (HH:MM) to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
