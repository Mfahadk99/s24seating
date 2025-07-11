// shows greetings on the top of the dasboard
sayGreetings = () => {
  var today = new Date();
  var curHr = today.getHours();

  if (curHr < 12) {
    $("#greeting").text("Good Morning!");
  } else if (curHr < 18) {
    $("#greeting").text("Good Afternoon!");
  } else {
    $("#greeting").text("Good Evening!");
  }
};

// start on loading
sayGreetings();

// Overview data is only available for master account (FOR NOW)
if (currentUser == "super_admin") {
  getClientsCount = () => {
    return; // TODO:
    $.ajax({
      type: "GET",
      url: "clients/clients-count",
      success: function (count) {
        $("#clientsCount").text(count);
      },
      error: function (err) {
        console.log(err);
      },
    });
  };

  getChatbotsCount = () => {
    return; // TODO:
    $.ajax({
      type: "GET",
      url: "dashboard/chatbots-count",
      success: function (chatbotsCount) {
        $("#chatbotsCount").text(chatbotsCount);
      },
      error: function (err) {
        console.log(err);
      },
    });
  };
  chatUsersCount;

  getChatUsersCount = () => {
    return; // TODO:
    $.ajax({
      type: "GET",
      url: "dashboard/users-count",
      success: function (chatUsersCount) {
        $("#chatUsersCount").text(chatUsersCount);
      },
      error: function (err) {
        console.log(err);
      },
    });
  };

  getChatSessionsCount = () => {
    return; // TODO:
    $.ajax({
      type: "GET",
      url: "dashboard/chat-sessions-count",
      success: function (chatSessionsCount) {
        $("#chatSessionsCount").text(chatSessionsCount);
      },
      error: function (err) {
        console.log(err);
      },
    });
  };

  getCallAgentsCount = () => {
    return; // TODO:
    $.ajax({
      type: "GET",
      url: "dashboard/call-agents-count",
      success: function (callAgentsCount) {
        $("#callAgentsCount").text(callAgentsCount);
      },
      error: function (err) {
        console.log(err);
      },
    });
  };

  // start the overview getters
  getClientsCount();
  getChatbotsCount();
  getChatUsersCount();
  getChatSessionsCount();
  getCallAgentsCount();
}
