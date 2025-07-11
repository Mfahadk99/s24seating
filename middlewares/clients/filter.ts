import User from "../../models/user.model";
import { Handler } from "express";

const filter: Handler = async (req, res, next) => {
  try {
    // extract the filter information
    const startDate = req.body.startDate ? req.body.startDate : null;
    const endDate = req.body.endDate ? req.body.endDate : null;
    const userName = req.body.userName ? req.body.userName : null;
    const packageID = req.body.packageID ? req.body.packageID : null;
    const sortBy = req.body.sortBy ? req.body.sortBy : null;
    const sortOrder = req.body.sortOrder ? req.body.sortOrder : null;
    const itemsPerPage = req.body.itemsPerPage ? req.body.itemsPerPage : null;
    const accountStatus = req.body.accountStatus
      ? req.body.accountStatus
      : null;

    let accounts = null;
    // get accountIDs if venueName OR packageName is selected

    // write the query for user collection
    const userQuery: any = {};
    userQuery.user_type = "client";
    userQuery.is_deleted = false;

    if (startDate || endDate) {
      console.log("startDate: ", new Date(startDate));
      console.log("endDate: ", new Date(endDate));
      userQuery.createdAt = {};
      if (startDate) userQuery.createdAt["$gte"] = new Date(startDate);
      if (endDate) userQuery.createdAt["$lte"] = new Date(endDate);
    }

    if (userName) {
      userQuery["$or"] = [
        { firstname: new RegExp(`${userName}`, "i") },
        { lastname: new RegExp(`${userName}`, "i") },
      ];
    }

    if (packageID) userQuery["package_tracker.package"] = packageID;

    // check active/inacive accounts
    if (accountStatus) {
      switch (accountStatus) {
        case "active": // since a month
          userQuery.last_visit_date = {};
          userQuery.last_visit_date["$gte"] = new Date(
            new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
          );
          break;
        case "inactive":
          userQuery["$or"] = [
            {
              last_visit_date: {
                $lt: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
              },
            },
            { last_visit_date: { $exists: false } },
          ];
          break;
        default:
          break;
      }
    }

    if (accounts) userQuery._id = { $in: accounts };

    // get all the _id of User
    let userIDs: any[] = await User.find(userQuery, "_id");
    userIDs = userIDs.map((x) => (<any>x)._id.toString()); // here userIDs contains the first domain of

    // >>> implement pagination here
    let pageNumber =
      req.query["page"] && Number(req.query["page"]) > 0
        ? Number(req.query["page"])
        : 1;
    const perPage = itemsPerPage ? Number(itemsPerPage) : 20;
    const skip = pageNumber ? perPage * (pageNumber - 1) : 0;

    // final query
    // console.log('final userIDs: ', userIDs);

    // find all the users
    const totalResults = await User.find({
      _id: { $in: userIDs },
      is_deleted: false,
    }).countDocuments();

    // prevent destruction from the UI
    if (pageNumber > Math.ceil(totalResults / perPage)) {
      pageNumber = totalResults / perPage;
    }

    res.locals.pagination = {
      pageNumber: pageNumber,
      perPage: perPage,
      totalResults: totalResults,
    };

    const sortFilter = {};
    if (sortBy && sortOrder) {
      sortFilter[`${sortBy}`] = `${sortOrder}`;
    } else {
      sortFilter[`createdAt`] = `desc`;
    }

    const clients = await User.find({
      _id: { $in: userIDs },
      is_deleted: false,
      status: { $ne: "unverified" },
    })
      .limit(perPage)
      .skip(skip)
      .sort(sortFilter)
      .exec();

    res.locals.clients = clients;
    return next();
  } catch (err) {
    return next(err);
  }
};

export default filter;
