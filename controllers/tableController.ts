import { Request, Response } from 'express';
import TableElement from '../models/table.model';
import FloorPlan from '../models/floor.model';
import Restaurant from '../models/restaurant.model';
import { handleResponse, handleError } from '../utils/responseHandler';

interface IUserRequest extends Request {
  user: { _id: string };
}

// Get all tables for a floor plan
export const getTables = async (req: Request, res: Response) => {
  try {
    const tables = await TableElement.find({
      floorPlanId: req.params.floorPlanId,
      status: 'active'
    });

    handleResponse(req, res, 200, {
      success: true,
      message: 'All tables for this floor plan have been retrieved successfully',
      data: tables,
      count: tables.length,
      tables,
      floorPlanId: req.params.floorPlanId
    });
  } catch (error: any) {
    handleError(req, res, 500, 'Error fetching tables', error);
  }
};

// Get table by ID
export const getTableById = async (req: Request, res: Response) => {
  try {
    const table = await TableElement.findById(req.params.id);
    if (!table) {
      return handleError(req, res, 404, 'Table not found');
    }

    handleResponse(req, res, 200, {
      success: true,
      message: 'Table has been retrieved successfully',
      data: table,
      table,
      floorPlanId: table.floorPlanId
    });
  } catch (error: any) {
    handleError(req, res, 500, 'Error fetching table', error);
  }
};

// Create new table
export const createTable = async (req: Request, res: Response) => {
  try {
    const floorPlan = await FloorPlan.findById(req.body.floorPlanId);
    if (!floorPlan) {
      return handleError(req, res, 404, 'Floor plan not found');
    }

    const tableData = {
      tableId: req.body.tableId,
      name: req.body.name || req.body.tableId,
      tableType: req.body.tableType,
      seats: req.body.seats,
      position: req.body.position,
      capacity: req.body.capacity,
      status: req.body.status || 'active',
      isReserved: req.body.isReserved || false,
      floorPlanId: req.body.floorPlanId,
      restaurantId: floorPlan.restaurantId,
      createdBy: req.user?._id || undefined
    };

    const table = new TableElement(tableData);
    await table.save();

    res.status(201).json({
      success: true,
      message: 'Table has been created successfully',
      data: table
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error creating table',
      error: error.message
    });
  }
};

// Update table
export const updateTable = async (req: IUserRequest, res: Response) => {
  try {
    const table = await TableElement.findById(req.params.id);
    if (!table) {
      return handleError(req, res, 404, 'Table not found');
    }

    const floorPlan = await FloorPlan.findById(table.floorPlanId);
    if (!floorPlan) {
      return handleError(req, res, 404, 'Floor plan not found');
    }

    const restaurant = await Restaurant.findById(floorPlan.restaurantId);
    if (!restaurant) {
      return handleError(req, res, 404, 'Restaurant not found');
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    if (updateData.capacity) {
      updateData.capacity = {
        minParty: table.capacity.minParty,
        maxParty: table.capacity.maxParty,
        ...updateData.capacity
      };
    }

    const updatedTable = await TableElement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTable) {
      return handleError(req, res, 404, 'Table not found after update');
    }

    handleResponse(req, res, 200, {
      success: true,
      message: 'Table has been updated successfully',
      data: updatedTable
    });
  } catch (error: any) {
    handleError(req, res, 400, 'Error updating table', error);
  }
};

// Delete table
export const deleteTable = async (req: IUserRequest, res: Response) => {
  try {
    const table = await TableElement.findById(req.params.id);
    if (!table) {
      return handleError(req, res, 404, 'Table not found');
    }

    await TableElement.findByIdAndDelete(req.params.id);

    handleResponse(req, res, 200, {
      success: true,
      message: 'Table has been permanently deleted',
      data: { id: table._id, name: table.name }
    });
  } catch (error: any) {
    handleError(req, res, 500, 'Error deleting table', error);
  }
};

// Bulk update table positions
export const updateTablePositions = async (req: IUserRequest, res: Response) => {
  try {
    const { tables } = req.body;

    if (!tables || tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No tables provided'
      });
    }

    const firstTable = await TableElement.findById(tables[0].id);
    if (!firstTable) {
      return res.status(404).json({
        success: false,
        message: 'First table not found'
      });
    }

    const floorPlan = await FloorPlan.findById(firstTable.floorPlanId);
    const restaurant = await Restaurant.findById(floorPlan?.restaurantId);
    if (!restaurant || restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update tables'
      });
    }

    const updates = tables.map((table: any) =>
      TableElement.findByIdAndUpdate(
        table.id,
        { position: table.position, updatedBy: req.user._id },
        { new: true }
      )
    );

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: 'Table positions have been updated successfully',
      data: { updatedCount: tables.length }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error updating positions',
      error: error.message
    });
  }
};

// Find available tables
export const findAvailableTables = async (req: Request, res: Response) => {
  try {
    const {
      floorPlanId,
      partySize,
      isReserved,
      tableType,
      status,
      minSeats,
      maxSeats,
      minParty,
      maxParty,
      positionX,
      positionY,
      createdBy,
      updatedBy,
      sortBy,
      sortOrder,
      limit,
      skip
    } = req.query;

    if (!floorPlanId) {
      return res.status(400).json({
        success: false,
        message: 'floorPlanId is required'
      });
    }

    const query: any = {
      floorPlanId,
      status: 'active'
    };

    if (partySize) {
      const size = parseInt(partySize as string);
      if (isNaN(size) || size < 1 || size > 20) {
        return res.status(400).json({
          success: false,
          message: 'partySize must be a number between 1 and 20'
        });
      }
      query['capacity.minParty'] = { $lte: size };
      query['capacity.maxParty'] = { $gte: size };
    }

    if (isReserved !== undefined) {
      query.isReserved = isReserved === 'true';
    }

    if (tableType) {
      const validTypes = ['round', 'square', 'rectangular', 'hexagon', 'bar'];
      if (validTypes.includes(tableType as string)) {
        query.tableType = tableType;
      }
    }

    if (status) {
      const validStatuses = ['active', 'inactive', 'reserved', 'maintenance'];
      if (validStatuses.includes(status as string)) {
        query.status = status;
      }
    }

    if (minSeats || maxSeats) {
      query.seats = {};
      if (minSeats) {
        const min = parseInt(minSeats as string);
        if (!isNaN(min)) query.seats.$gte = min;
      }
      if (maxSeats) {
        const max = parseInt(maxSeats as string);
        if (!isNaN(max)) query.seats.$lte = max;
      }
    }

    if (minParty) {
      const min = parseInt(minParty as string);
      if (!isNaN(min)) query['capacity.minParty'] = { $gte: min };
    }

    if (maxParty) {
      const max = parseInt(maxParty as string);
      if (!isNaN(max)) query['capacity.maxParty'] = { $lte: max };
    }

    if (positionX) query['position.x'] = parseInt(positionX as string);
    if (positionY) query['position.y'] = parseInt(positionY as string);
    if (createdBy) query.createdBy = createdBy;
    if (updatedBy) query.updatedBy = updatedBy;

    const sortOptions: any = {};
    if (sortBy) {
      const validSortFields = [
        'name', 'tableId', 'tableType', 'seats', 'status',
        'isReserved', 'createdAt', 'updatedAt', 'position.x', 'position.y'
      ];
      if (validSortFields.includes(sortBy as string)) {
        sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
      }
    } else {
      sortOptions.name = 1;
    }

    const paginationOptions: any = {};
    if (limit) {
      const limitNum = parseInt(limit as string);
      if (!isNaN(limitNum) && limitNum > 0) {
        paginationOptions.limit = Math.min(limitNum, 100);
      }
    }

    if (skip) {
      const skipNum = parseInt(skip as string);
      if (!isNaN(skipNum) && skipNum >= 0) {
        paginationOptions.skip = skipNum;
      }
    }

    const tables = await TableElement.find(query, null, paginationOptions).sort(sortOptions);
    const totalCount = await TableElement.countDocuments(query);

    res.status(200).json({
      success: true,
      message: partySize
        ? `Available tables for party size ${partySize} have been found successfully`
        : 'All active tables have been found successfully',
      data: tables,
      count: tables.length,
      totalCount,
      pagination: {
        limit: paginationOptions.limit || totalCount,
        skip: paginationOptions.skip || 0,
        hasMore: (paginationOptions.skip || 0) + tables.length < totalCount
      },
      query: {
        floorPlanId,
        partySize,
        isReserved,
        tableType,
        status,
        minSeats,
        maxSeats,
        minParty,
        maxParty,
        sortBy,
        sortOrder
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error finding available tables',
      error: error.message
    });
  }
};

// Get tables by restaurant ID
export const getTablesByRestaurantId = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return handleError(req, res, 404, 'Restaurant not found');
    }

    // Find all tables for this restaurant
    const tables = await TableElement.find({
      restaurantId: restaurantId,
      status: 'active'
    });

    handleResponse(req, res, 200, {
      success: true,
      message: 'All tables for this restaurant have been retrieved successfully',
      data: tables,
      count: tables.length,
      restaurantId
    });
  } catch (error: any) {
    handleError(req, res, 500, 'Error fetching restaurant tables', error);
  }
};
