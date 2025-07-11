// Initialize Drawflow editor
const container = document.getElementById("drawflow");
const editor = new Drawflow(container, { touchSupport: true });
editor.start();

// Editor options
editor.zoom_value = 0.05;
editor.zoom_max = 3;
editor.zoom_min = 0.1;
editor.reroute = true;

// Add Start Node
function addStartNode() {
  editor.addNode(
    "start", // Node name
    0, // Number of inputs
    1, // Number of outputs
    50, // X position
    243, // Y position
    "node start", // CSS class
    {}, // Data
    `<div class="node start" id="startNode"><i class="la la-home"></i> Start</div>`,
  );
}

// Add Event Node
function addEventNode(pos_x, pos_y, question = "") {
  const nodeId = Date.now(); // Unique ID
  const template = `
  <div class="node event">
    <div class="title-box" >
      <input type="text" id="eventName-${nodeId}" class="event-name" df-event-name placeholder="Enter event name" value="${question}">
      <i class="collapse-icon fa fa-chevron-down" data-toggle="collapse" href="#eventCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="eventCollapse-${nodeId}"></i>
    </div>
    <div class="box collapse custom-collapse" id="eventCollapse-${nodeId}">

      <label for="eventDescription-${nodeId}" class="mt-2">Description</label>
      <textarea id="eventDescription-${nodeId}" class="form-control" df-event-description placeholder="Enter event description">A question similar: ${question}</textarea>
    </div>
  </div>
  `;

  editor.addNode(
    "event",
    1,
    1,
    pos_x,
    pos_y,
    "node event",
    { id: nodeId, name: "", description: "" }, // You can track name and description in the data
    template,
  );
}

// Add Action Node
function addActionNode(actionType, pos_x, pos_y) {
  console.log(actionType);
  if (editor.editor_mode === "fixed") {
    return false;
  }
  pos_x =
    pos_x *
      (editor.precanvas.clientWidth /
        (editor.precanvas.clientWidth * editor.zoom)) -
    editor.precanvas.getBoundingClientRect().x *
      (editor.precanvas.clientWidth /
        (editor.precanvas.clientWidth * editor.zoom));
  pos_y =
    pos_y *
      (editor.precanvas.clientHeight /
        (editor.precanvas.clientHeight * editor.zoom)) -
    editor.precanvas.getBoundingClientRect().y *
      (editor.precanvas.clientHeight /
        (editor.precanvas.clientHeight * editor.zoom));
  const nodeId = Date.now(); // Unique ID
  const templates = {
    query_date: `
    <div class="node action">
        <div class="title-box" data-toggle="collapse" href="#queryDateCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="queryDateCollapse-${nodeId}">
            <i class="fas fa-calendar-day"></i>  Query Date
        </div>
        <div class="box collapse custom-collapse" id="queryDateCollapse-${nodeId}">
            <label for="queryDate-${nodeId}">Enter the query for the date:</label>
            <textarea df-template placeholder="Could you please provide the date?"></textarea>
        </div>
    </div>`,

    query_time: `
    <div class="node action">
        <div class="title-box" data-toggle="collapse" href="#queryTimeCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="queryTimeCollapse-${nodeId}">
            <i class="fas fa-clock"></i> Query Time
        </div>
        <div class="box collapse custom-collapse" id="queryTimeCollapse-${nodeId}">
            <textarea df-template placeholder="At what time would you prefer?"></textarea>
        </div>
    </div>`,

    query_number: `
    <div class="node action">
        <div class="title-box" data-toggle="collapse" href="#queryNumberCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="queryNumberCollapse-${nodeId}">
            <i class="fas fa-hashtag"></i> Query Number
        </div>
        <div class="box collapse custom-collapse" id="queryNumberCollapse-${nodeId}">
            <textarea df-template placeholder="Specify the number"></textarea>
        </div>
    </div>`,

    query_email: `
    <div class="node action">
        <div class="title-box" data-toggle="collapse" href="#queryEmailCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="queryEmailCollapse-${nodeId}">
            <i class="fas fa-envelope"></i> Query Email
        </div>
        <div class="box collapse custom-collapse" id="queryEmailCollapse-${nodeId}">
            <textarea df-template placeholder="Could you please provide your email address?"></textarea>
        </div>
    </div>`,

    query_phoneNumber: `
    <div class="node action">
        <div class="title-box" data-toggle="collapse" href="#queryPhoneNumberCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="queryPhoneNumberCollapse-${nodeId}">
            <i class="fas fa-phone"></i> Query Phone Number
        </div>
        <div class="box collapse custom-collapse" id="queryPhoneNumberCollapse-${nodeId}">
            <textarea df-template placeholder="What is your phone number?"></textarea>
        </div>
    </div>`,

    query_text: `
    <div class="node action">
        <div class="title-box" data-toggle="collapse" href="#queryTextCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="queryTextCollapse-${nodeId}">
            <i class="fas fa-file"></i> Query Text
        </div>
        <div class="box collapse custom-collapse" id="queryTextCollapse-${nodeId}">
            <textarea df-template placeholder="Please provide text about ..."></textarea>
        </div>
    </div>`,

    send_reply: `
    <div class="node action">
        <div class="title-box" data-toggle="collapse" href="#replyCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="replyCollapse-${nodeId}">
            <i class="la la-arrow-circle-right"></i> Reply
        </div>
        <div class="box collapse custom-collapse" id="replyCollapse-${nodeId}">
            <textarea df-template placeholder="Enter the response text here..."></textarea>
        </div>
    </div>
  `,
    send_notification: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#notificationCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="notificationCollapse-${nodeId}"><i class="la la-bell"></i> Notification</div>
          <div class="box collapse custom-collapse" id="notificationCollapse-${nodeId}">
              <textarea df-template placeholder="Enter the notification message here..."></textarea>
          </div>
      </div>
  `,
    send_email: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#emailCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="emailCollapse-${nodeId}"><i class="la la-envelope"></i> Send Email</div>
          <div class="box collapse custom-collapse" id="emailCollapse-${nodeId}">
              <label for="email-address">Email Address:</label>
              <input type="email" id="email-address" placeholder="Enter recipient's email address...">
              <label for="email-subject">Subject:</label>
              <input type="text" id="email-subject" placeholder="Enter email subject...">
              <label for="email-body">Body:</label>
              <textarea id="email-body" placeholder="Enter email body here..."></textarea>
          </div>
      </div>
  `,
    send_sms: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#smsCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="smsCollapse-${nodeId}"><i class="fas fa-sms"></i> Send SMS</div>
          <div class="box collapse custom-collapse" id="smsCollapse-${nodeId}">
              <label for="sms-message">Message:</label>
              <textarea  df-template id="sms-message" placeholder="Enter SMS message here..."></textarea>
          </div>
      </div>
  `,
    send_call: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#callCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="callCollapse-${nodeId}"><i class="la la-phone"></i> Make a Call</div>
          <div class="box collapse custom-collapse" id="callCollapse-${nodeId}">
              <label for="call-number">Phone Number:</label>
              <input type="tel" id="call-number" placeholder="Enter phone number to call...">
              <label for="call-script">Script:</label>
              <textarea id="call-script" placeholder="Enter call script here..."></textarea>
          </div>
      </div>
  `,
    send_notifyUser: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#notifyUserCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="notifyUserCollapse-${nodeId}"><i class="la la-bell"></i> Notify User</div>
          <div class="box collapse custom-collapse" id="notifyUserCollapse-${nodeId}">
              <textarea df-template placeholder="Enter notification message here..."></textarea>
          </div>
      </div>
  `,
    webhook: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#webhookCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="webhookCollapse-${nodeId}"><i class="la la-external-link"></i> Webhook</div>
          <div class="box collapse custom-collapse" id="webhookCollapse-${nodeId}">
              <label for="webhook-url">Webhook URL:</label>
              <input type="url" id="webhook-url" placeholder="Enter webhook URL...">
              <label for="webhook-payload">Payload:</label>
              <textarea id="webhook-payload" placeholder="Enter webhook payload here..."></textarea>
          </div>
      </div>
  `,
    redirect: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#redirectCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="redirectCollapse-${nodeId}"><i class="la la-link"></i> Redirect</div>
          <div class="box collapse custom-collapse" id="redirectCollapse-${nodeId}">
              <label for="redirect-url">Redirect URL:</label>
              <input type="url" id="redirect-url" placeholder="Enter URL to redirect to...">
          </div>
      </div>
  `,
    log: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#logCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="logCollapse-${nodeId}"><i class="la la-file-text"></i> Log</div>
          <div class="box collapse custom-collapse" id="logCollapse-${nodeId}">
              <textarea df-template placeholder="Enter log message here..."></textarea>
          </div>
      </div>
  `,
    setVariable: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#setVariableCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="setVariableCollapse-${nodeId}"><i class="la la-cogs"></i> Set Variable</div>
          <div class="box collapse custom-collapse" id="setVariableCollapse-${nodeId}">
              <label for="variable-name">Variable Name:</label>
              <input type="text" id="variable-name" placeholder="Enter variable name...">
              <label for="variable-value">Value:</label>
              <input type="text" id="variable-value" placeholder="Enter variable value...">
          </div>
      </div>
  `,
    showMessage: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#showMessageCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="showMessageCollapse-${nodeId}"><i class="la la-comment"></i> Show Message</div>
          <div class="box collapse custom-collapse" id="showMessageCollapse-${nodeId}">
              <textarea df-template placeholder="Enter message to display here..."></textarea>
          </div>
      </div>
  `,
    wait: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#waitCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="waitCollapse-${nodeId}"><i class="la la-hourglass-half"></i> Wait</div>
          <div class="box collapse custom-collapse" id="waitCollapse-${nodeId}">
              <label for="wait-time">Wait Time (seconds):</label>
              <input type="number" id="wait-time" placeholder="Enter wait time in seconds...">
          </div>
      </div>
  `,
    delay: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#delayCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="delayCollapse-${nodeId}"><i class="la la-clock"></i> Delay</div>
          <div class="box collapse custom-collapse" id="delayCollapse-${nodeId}">
              <label for="delay-duration">Delay Duration (seconds):</label>
              <input type="number" id="delay-duration" placeholder="Enter delay duration in seconds...">
          </div>
      </div>
  `,
    updateProfile: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#updateProfileCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="updateProfileCollapse-${nodeId}"><i class="la la-user"></i> Update Profile</div>
          <div class="box collapse custom-collapse" id="updateProfileCollapse-${nodeId}">
              <label for="profile-field">Profile Field:</label>
              <input type="text" id="profile-field" placeholder="Enter profile field to update...">
              <label for="profile-value">Value:</label>
              <input type="text" id="profile-value" placeholder="Enter new value...">
          </div>
      </div>
  `,
    addToList: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#addToListCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="addToListCollapse-${nodeId}"><i class="la la-list"></i> Add to List</div>
          <div class="box collapse custom-collapse" id="addToListCollapse-${nodeId}">
              <label for="list-name">List Name:</label>
              <input type="text" id="list-name" placeholder="Enter list name...">
              <label for="list-item">Item:</label>
              <input type="text" id="list-item" placeholder="Enter item to add...">
          </div>
      </div>
  `,
    removeFromList: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#removeFromListCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="removeFromListCollapse-${nodeId}"><i class="la la-minus-circle"></i> Remove from List</div>
          <div class="box collapse custom-collapse" id="removeFromListCollapse-${nodeId}">
              <label for="list-name">List Name:</label>
              <input type="text" id="list-name" placeholder="Enter list name...">
              <label for="list-item">Item:</label>
              <input type="text" id="list-item" placeholder="Enter item to remove...">
          </div>
      </div>
  `,
    sendReminder: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#sendReminderCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="sendReminderCollapse-${nodeId}"><i class="la la-calendar-check"></i> Send Reminder</div>
          <div class="box collapse custom-collapse" id="sendReminderCollapse-${nodeId}">
              <label for="reminder-date">Reminder Date:</label>
              <input type="date" id="reminder-date">
              <label for="reminder-time">Reminder Time:</label>
              <input type="time" id="reminder-time">
              <label for="reminder-message">Message:</label>
              <textarea id="reminder-message" placeholder="Enter reminder message here..."></textarea>
          </div>
      </div>
  `,
    processPayment: `
      <div class="node action">
          <div class="title-box" data-toggle="collapse" href="#processPaymentCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="processPaymentCollapse-${nodeId}"><i class="la la-credit-card"></i> Process Payment</div>
          <div class="box collapse custom-collapse" id="processPaymentCollapse-${nodeId}">
              <label for="payment-amount">Amount:</label>
              <input type="number" id="payment-amount" placeholder="Enter payment amount...">
              <label for="payment-method">Payment Method:</label>
              <select id="payment-method">
                  <option value="credit-card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank-transfer">Bank Transfer</option>
              </select>
          </div>
      </div>
  `,
  };

  if (actionType == "event") {
    addEventNode(pos_x, pos_y, question);
    return;
  }
  const template =
    templates[actionType] ||
    `<div class="node action">
        <div class="title-box" data-toggle="collapse" href="#generalCollapse-${nodeId}" role="button" aria-expanded="false" aria-controls="generalCollapse-${nodeId}"><i class="la la-cog"></i> Action</div>
        <div class="box collapse custom-collapse" id="generalCollapse-${nodeId}">
            <textarea df-template placeholder="Specify the action details here..."></textarea>
        </div>
    </div>`;
  console.log("CALLED");
  editor.addNode(
    "action",
    1,
    1,
    pos_x,
    pos_y,
    "node action",
    {
      id: nodeId,
      template: "",
      type: actionType,
      input1: "",
      input2: "",
      input3: "",
    },
    template,
  );
}

function zoomIn() {
  editor.zoom_in();
}

function zoomOut() {
  editor.zoom_out();
}

function resetZoom() {
  // Reset zoom to default value
  editor.zoom_value = 1;
  editor.zoom_reset();
}
let diagram = "";

// Import Data
function importData() {
  // Example import data (you can replace this with real data)
  console.log(typeof diagram);
  editor.import(diagram);
}

function exportData() {
  // Example import data (you can replace this with real data)
  // editor.import(exampleData);
  diagram = editor.export();
  console.log(typeof editor.export());
}

// Handle Node Events
editor.on("nodeCreated", (id) => {
  console.log("Node created: " + id);
});

editor.on("nodeRemoved", (id) => {
  console.log("Node removed: " + id);
});

editor.on(
  "connectionCreated",
  (output_id, input_id, output_class, input_class) => {
    console.log("Connection created from " + output_id + " to " + input_id);
  },
);

editor.on(
  "connectionRemoved",
  (output_id, input_id, output_class, input_class) => {
    console.log("Connection removed from " + output_id + " to " + input_id);
  },
);

function cleanDrawflowData(drawflowData) {
  const cleanedData = { drawflow: {} };

  for (const [moduleName, moduleData] of Object.entries(
    drawflowData.drawflow,
  )) {
    cleanedData.drawflow[moduleName] = { data: {} };

    for (const [nodeId, node] of Object.entries(moduleData.data)) {
      cleanedData.drawflow[moduleName].data[nodeId] = {
        id: node.id,
        name: node.name,
        data: node.data || {},
        pos_x: node.pos_x,
        pos_y: node.pos_y,
        class: node.class,
        html: node.html,
        typenode: false,
        inputs: node.inputs || {},
        outputs: node.outputs,
      };
    }
  }
  console.log("cleanedData", cleanedData);
  return cleanedData;
}

async function saveFlowDiagram() {
  try {
    $("#alertDiv").fadeIn(500);
    $("#alertMsg").text("Saving the flow of events... Please wait.");
    $("#alertBox")
      .removeClass("alert-success alert-danger")
      .addClass("alert-warning");
    scrollTo("#head");
    const knowledgeBaseEntryId = $("#knowledgeBaseEntryId").val();
    const drawflowData = editor.export();
    console.log(drawflowData);
    console.log(drawflowData[0]);
    const response = await fetch(
      `/call-center/flow-controller/entity-flow-diagram?knowledgeBaseEntryId=${knowledgeBaseEntryId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: cleanDrawflowData(drawflowData) }), // Sending the data as JSON string
      },
    );

    if (!response.ok) {
      throw new Error("Failed to save diagram data");
    }

    const result = await response.json();
    if (result.success) {
      $("#alertDiv").fadeIn(500);
      $("#alertMsg").text(`The Flow of events is saved successfully!`);
      $("#alertBox")
        .removeClass("alert-warning alert-danger")
        .addClass("alert-success");
      scrollTo("#head");
    }
    console.log(result); // Handle the response
  } catch (error) {
    $("#alertDiv").fadeIn(500);
    $("#alertMsg").text(`Something went wrong. Please try again later!`);
    $("#alertBox")
      .removeClass("alert-success alert-warning")
      .addClass("alert-danger");
    scrollTo("#head");
    console.error("Error saving diagram:", error);
  }
}

async function LoadFlowDiagram(knowledgeBaseEntryId) {
  try {
    editor.clear();
    $("#alertDiv").fadeIn(500);
    $("#alertMsg").text("Loading the flow of events... Please wait.");
    $("#alertBox")
      .removeClass("alert-success alert-danger")
      .addClass("alert-warning");
    scrollTo("#head");
    // Fetch the saved diagram data from your server
    const response = await fetch(
      `/call-center/flow-controller/entity-flow-diagram?knowledgeBaseEntryId=${knowledgeBaseEntryId}`,
    ); // Adjust the URL as necessary
    if (!response.ok) {
      throw new Error("Failed to fetch diagram data");
    }

    const result = await response.json();

    // close alert
    $("#alertDiv").fadeOut(500);

    // no diagram yet
    if (!result.data) {
      // Set up initial nodes
      addStartNode();
      addEventNode(100, 100, question);
      editor.addConnection(1, 2, "output_1", "input_1");
      return;
    }
    // Define a function to apply default values
    const applyDefaults = (data) => {
      if (data) {
        Object.keys(data.drawflow.Home.data).forEach((key) => {
          const node = data.drawflow.Home.data[key];

          // Apply default values for inputs and outputs if they are missing
          if (!node.inputs) {
            node.inputs = {};
          }
          Object.keys(node.inputs).forEach((inputKey) => {
            if (!node.inputs[inputKey].connections) {
              node.inputs[inputKey].connections = [];
            }
          });

          if (!node.outputs) {
            node.outputs = {};
          }
          Object.keys(node.outputs).forEach((outputKey) => {
            if (!node.outputs[outputKey].connections) {
              node.outputs[outputKey].connections = [];
            }
          });

          // Apply default values for other fields if needed
          if (!node.data) {
            node.data = {};
          }
        });
      }
    };

    // Apply defaults to the fetched data
    applyDefaults(result.data);

    // Import the fetched and default-applied diagram data into the Drawflow editor
    editor.import(result.data);
  } catch (error) {
    console.error("Error loading diagram:", error);
  }
}

function toggleFullScreen() {
  const mainContainer = document.getElementById("mainContainer");
  const toolbar = document.querySelector(".toolbar");

  if (!document.fullscreenElement) {
    console.log("FULL");
    // Enter full-screen mode
    if (mainContainer.requestFullscreen) {
      mainContainer.requestFullscreen();
    } else if (mainContainer.mozRequestFullScreen) {
      /* Firefox */
      mainContainer.mozRequestFullScreen();
    } else if (mainContainer.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      mainContainer.webkitRequestFullscreen();
    } else if (mainContainer.msRequestFullscreen) {
      /* IE/Edge */
      mainContainer.msRequestFullscreen();
    }

    // Unset top and left properties
    if (toolbar) {
      toolbar.style.top = "unset";
      toolbar.style.left = "unset";
    }
  } else {
    console.log("Exit FULL");
    // Exit full-screen mode
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE/Edge */
      document.msExitFullscreen();
    }

    // Reset top and left properties
    if (toolbar) {
      toolbar.style.top = "110px"; // Reset to default position
      toolbar.style.left = "22px"; // Reset to default position
    }
  }
}

/* DRAG EVENT */

/* Mouse and Touch Actions */

var elements = document.getElementsByClassName("drag-drawflow");
for (var i = 0; i < elements.length; i++) {
  elements[i].addEventListener("touchend", drop, false);
  elements[i].addEventListener("touchmove", positionMobile, false);
  elements[i].addEventListener("touchstart", drag, false);
}

var mobile_item_selec = "";
var mobile_last_move = null;
function positionMobile(ev) {
  mobile_last_move = ev;
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  if (ev.type === "touchstart") {
    mobile_item_selec = ev.target
      .closest(".drag-drawflow")
      .getAttribute("data-node");
  } else {
    ev.dataTransfer.setData("node", ev.target.getAttribute("data-node"));
  }
}

function drop(ev) {
  if (ev.type === "touchend") {
    var parentdrawflow = document
      .elementFromPoint(
        mobile_last_move.touches[0].clientX,
        mobile_last_move.touches[0].clientY,
      )
      .closest("#drawflow");
    if (parentdrawflow != null) {
      addActionNode(
        mobile_item_selec,
        mobile_last_move.touches[0].clientX,
        mobile_last_move.touches[0].clientY,
      );
    }
    mobile_item_selec = "";
  } else {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("node");
    addActionNode(data, ev.clientX, ev.clientY);
  }
}

function updateConnections(parentId) {
  setTimeout(() => {
    editor.updateConnectionNodes(parentId);
  }, 10); // waits for 500 milliseconds before calling the function
}

$(document).ready(function () {
  // Use event delegation to handle clicks on dynamically added elements
  $(document).on("click", ".title-box", function (e) {
    e.preventDefault(); // Prevent default action if it's a link
    console.log("CLICKED");
    // Find the closest parent node with an ID
    const parentDiv = $(this).closest("div[id]");
    const parentId = parentDiv.attr("id");
    console.log("Parent ID:", parentId);

    updateConnections(parentId);
  });

  // Use event delegation to handle clicks on dynamically added elements
  $(document).on("click", ".collapse-icon", function () {
    // Toggle collapse
    var target = $(this).data("bs-target");
    var $collapse = $(target);
    $collapse.collapse("toggle");
  });

  // Update icon rotation based on collapse events
  $(document).on("shown.bs.collapse", function (e) {
    $(e.target)
      .prev(".title-box")
      .find(".collapse-icon")
      .removeClass("fa-chevron-down")
      .addClass("fa-chevron-up");
  });

  $(document).on("hidden.bs.collapse", function (e) {
    $(e.target)
      .prev(".title-box")
      .find(".collapse-icon")
      .removeClass("fa-chevron-up")
      .addClass("fa-chevron-down");
  });
});
