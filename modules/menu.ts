class Menu {
  common: any;
  client: any;
  superAdmin: any;

  constructor() {
    this.common = [
      "/",
      "/new",
      "/profile",
      "/public",
      "/release",
      "/dashboard",
      "/login",
      "/logout",
      "/error",
      "/query",
      "/preview",
      "/widget",
      "/test",
      "/client-form",
      "/restaurants/all",
    ];
    this.client = [
      ...this.common,
      "/chatbot-users",
      "/call-center-users",
      "/chatbots",
      "/call-center",
      "/knowledge-base",
      "/activities",
      "/integrations",
      "/contacts",
      "/training",
      "/flow-controller",
      "/integrations",
      "/account-settings",
      "/widget",
      "/demo-manager",
      "/chatbot-offers",
      "/chatbot-training",
      "/call-center-offers",
      "/call-center-training",
      "/availability",
      "/tables",
      "/restaurants",
      "/floorplans",
      "/reservation",
      "/shifts/restaurant",
      "/restaurants/admin-restaurant",
      "/restaurants/settings",
      "/restaurants/owner",
      "/restaurants/detail",
      "/restaurants/all-restaurants-admin",
      "/restaurants/my-restaurants",
      "/shifts",
      "/waitlist",
      "/reservation/available-slots",
      "/server",
      "/server/restaurant",
      "/server/assign-reservation",
      "/server/remove-reservation",
      "/settings/restaurant",
      "/settings"
    ];
    this.superAdmin = [
      ...this.common,
      "/clients",
      "/settings",
      "/widget",
      "/tfn-verification",
      "/costs-calculator",
    ];
  }
}

export { Menu };
