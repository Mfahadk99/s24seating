// TODO: **-Test
import { Handler } from "express";
import { Menu } from "../../modules/menu";

const checkMenu: Handler = async (req, res, next) => {
  if (req.user) {
    res.locals.isTwoWayOn = false;
    // personalize the menu
    const menu = new Menu();
    if (res.locals.currentUser.user_type == "client") {
      res.locals.menu = menu.client;
      isAccessible(menu.client);
    } else if (res.locals.currentUser.user_type == "super_admin") {
      res.locals.menu = menu.superAdmin;
      isAccessible(menu.superAdmin);
    } else {
      res.locals.menu = menu.common;
      isAccessible(menu.common);
    }
  } else {
    return next();
  }

  function isAccessible(menuArr: string[]) {
    let urlArr = req.url.split("/");
    // remove the first element empty string [''] from the array
    urlArr.shift();
    const firstSlug = urlArr[0].split("?");
    urlArr.shift();
    urlArr = [...firstSlug, ...urlArr];
    let url = "";
    for (let i = 0; i < urlArr.length; i++) {
      // get the url
      const slug = urlArr[i];
      url += `/${slug}`;

      // reject if not included
      if (!menuArr.includes(url)) {
        if (i === urlArr.length - 1) {
          console.log("url: ", url);
          console.log("route not allowed");
          req.flash(
            "error",
            "You are not authorized to visit the page! Please contact the admin.",
          );
          // res.end();
          res.redirect("/dashboard");
        }
      } else {
        return next();
      }
    }
  }
};

export default checkMenu;
