/*------------ Check if two passwords match: Reset Password ------------- */

function matchPasswords() {
  /**
   *
   * @param {string} id - id of the element
   * @returns {HTMLElement} HTMLelement
   *
   */
  let elem = (id) => document.getElementById(id);

  // disable the button
  elem("submitBtn").disabled = true;
  elem("submitBtn").style.cursor = "not-allowed";

  // get the inputs
  let passwordInputsArr = document.querySelectorAll(
    "#passwordInput, #repeatPasswordInput",
  );

  // listen to the 'input' event
  passwordInputsArr.forEach((item) => {
    item.addEventListener("input", () => {
      let passwordInput = elem("passwordInput").value;
      let repeatPasswordInput = elem("repeatPasswordInput").value;

      if (
        passwordInput.length != 0 &&
        repeatPasswordInput.length != 0 &&
        passwordInput === repeatPasswordInput
      ) {
        elem("submitBtn").disabled = false;
        elem("submitBtn").style.cursor = "pointer";
      } else {
        elem("submitBtn").disabled = true;
        elem("submitBtn").style.cursor = "not-allowed";
      }
    });
  });
}

/*------------------ Upload Image with Preview ------------------*/

/**
 *
 * @param {HTMLElement} input - image input
 * @param {string} previewDivId - id of the preview div
 * @returns {void}
 *
 */
function showPreview(input, previewDivId) {
  if (input.files && input.files[0]) {
    let allowedSize = 2097152;
    if (input.files[0].size > allowedSize) {
      input.value = null;
      swal("Warning!", "File exceeded the max size of 2 MB!", "warning");
      return;
    }
    console.log("input.files[0]: ", input.files[0]);
    var reader = new FileReader();
    reader.onload = function (e) {
      $(`#${previewDivId}`).css(
        "background-image",
        "url(" + e.target.result + ")",
      );
      $(`#${previewDivId}`).hide();
      $(`#${previewDivId}`).fadeIn(650);
    };
    reader.readAsDataURL(input.files[0]);
  }
}

/*------------------- Form Submit: profile/general -----------------*/

// alertDiv function

/**
 *
 * @param {HTMLElement} alertDiv - Alert Div Element
 * @param {String} status - alert status 'success'/'error'
 * @param {String} message - message to be shown
 *
 */
function showAlert(alertDiv, status, message, autohide = true) {
  alertDiv.innerText = message;
  alertDiv.style.display = "block";

  if (status === "success") {
    alertDiv.classList.remove("alert-danger");
    alertDiv.classList.remove("alert-warning");
    alertDiv.classList.add("alert-success");
  } else {
    alertDiv.classList.add("alert-danger");
    alertDiv.classList.remove("alert-warning");
    alertDiv.classList.remove("alert-success");
  }
  if (autohide) {
    setTimeout(() => {
      alertDiv.style.display = "none";
    }, 10000);
  }
}

/**
 *
 * @param {HTMLElement[]} formInputs
 * @param {HTMLElement} submitBtn
 * @param {HTMLElement} alertDiv
 * @param {string} url - action url
 * @param {string} formId
 * @param {requestCallback} callback - optional
 */

function ajaxFormSubmit(
  formInputs,
  submitBtn,
  alertDiv,
  url,
  formId,
  callback,
) {
  // disable the submit button in case of no change
  submitBtn.disabled = true;

  formInputs.forEach((item) => {
    item.addEventListener("input", () => {
      submitBtn.disabled = false;
    });
  });

  //

  submitBtn.addEventListener("click", (event) => {
    event.preventDefault();

    $.ajax({
      type: "PUT",
      url: url,
      data: $(formId).serializeArray(),
      dataType: "json",
      success: (data) => {
        const status = data.message.includes("Success") ? "success" : "error";
        showAlert(alertDiv, status, data.message);
        submitBtn.disabled = true;
        // invoke callback
        if (callback) {
          callback();
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        showAlert(alertDiv, "error", "Something went wrong! Try again later.");
        submitBtn.disabled = true;
        console.log("error in ajaxFormSubmit: XMLHttpRequest ", XMLHttpRequest);
        console.log("error in ajaxFormSubmit: textStatus", textStatus);
        console.log("error in ajaxFormSubmit: errorThrown", errorThrown);
        // invoke callback
        if (callback) {
          callback();
        }
      },
    });
    scrollTo("#alertDiv");
  });
}

/*------- Scroll to element ---------*/
/**
 *
 * @param {String} selector - id/class selector (e.g. "#idName" or ".className")
 */
function scrollTo(selector) {
  $("html, body").animate(
    {
      scrollTop: $(selector).offset().top,
    },
    500,
  );
}

/*-------------- parse variable from server ---------------*/

/**
 *
 * @param {String} prefix - prompt/venue
 * @param {Array} Arr - prompt/venue array
 */
function boxChecker(prefix, Arr) {
  Arr.forEach((item) => {
    if (document.querySelector(`#${prefix}_${item}`)) {
      document.querySelector(`#${prefix}_${item}`).checked = true;
    }
  });
}

/*--------------- confirm leave ------------------*/
function confirmLeave() {
  window.onbeforeunload = function () {
    return "Are you sure you want to leave?";
  };
}

function removeElement(id) {
  document.getElementById(id).outerHTML = "";
  document.querySelector("#submitBtn").disabled = false;
}

function changeButtonText(formID) {
  let elements = document.getElementById(formID).elements;
  let len = elements.length;
  let submit = null;
  for (let i = 0; i < len; i++) {
    if (elements[i].type === "submit") {
      submit = elements[i];
    }
  }

  if (submit.localName === "button") {
    submit.innerHTML = "Set Value";
  }
  if (submit.localName === "input") {
    submit.value = "Set Value";
  }
  submit.className = "btn btn-warning";
}

/**
 * reset a form and submit it afterwards
 *
 * @param {string} formID
 */
function resetForm(formID) {
  document.getElementById(formID).reset();
  $(`#${formID}`).submit();
  return;
}

function submitForm(formID) {
  $(`#${formID}`).submit();
}

function autoFitHeight() {
  $("textarea")
    .each(function () {
      this.setAttribute(
        "style",
        "height:" + this.scrollHeight + "px;overflow-y:hidden;",
      );
    })
    .on("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

// close alert
closeAlert = () => {
  $("#alertDiv").hide();
};

/* Check for any notification periodically */
// setInterval(() => {
//     getNotifications();
// }, 200000);

function getNotifications() {
  // TODO: OPTIMIZE AND RERUN
  // $.ajax({
  //     type: 'GET',
  //     url: '/notifier/get-actives',
  //     success: (data) => {
  //         if (data && data[0] && data[0].account) {
  //             showNotifications(data);
  //         } else {
  //             // clear old notifications
  //             $('#notifications-list').hide();
  //             $('#notifications-items').html('');
  //             $('#bellNumber').hide();
  //             $('.numOfNotifications').hide();
  //             $('.dropdown-notification').hide();
  //         }
  //     },
  //     error: (err) => {
  //         console.log(err)
  //     }
  // })
}

if (typeof isSuper != "undefined" && isSuper) {
  getNotifications();
}

$.fn.digits = function () {
  return this.each(function () {
    $(this).text(
      $(this)
        .text()
        .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"),
    );
  });
};

showNotifications = (data) => {
  $(".dropdown-notification").show();
  $("#navbar-mobile").addClass("show");
  setTimeout(() => $("#navbar-mobile").removeClass("show"), 1500);

  // show notifications count
  $("#bellNumber").show();
  $(".numOfNotifications").show();
  $(".numOfNotifications").text(data.length);

  // show the notifications
  $("#notifications-list").show();
  $("#notifications-items").html("");
  for (let i = 0; i < data.length; i++) {
    const notification = data[i];
    const id = notification["_id"];
    const category = notification["category"];
    const clientId = notification["account"]["_id"];
    const client =
      notification["account"]["firstname"] +
      " " +
      notification["account"]["lastname"];
    const keyword = notification["keyword"]["name"];
    var icon;
    // 'list scrubbing' | 'list management' | 'sendig' | 'campaign management' | 'billing' | 'other';
    switch (category) {
      case "list scrubbing":
        icon = "la la-align-justify bg-danger";
        break;
      case "list management":
        icon = "la la-sliders bg-warning";
        break;
      case "campaign sending":
        icon = "la la-send bg-danger";
        break;
      case "campaign management":
        icon = "la la-cog bg-info";
        break;
      case "billing":
        icon = "la la-dollar bg-success";
        break;
      case "other":
        icon = "la la-info bg-secondary";
        break;
      default:
        break;
    }
    const description = notification["description"];

    var item = `<a href="javascript:void(0)" class="not-item text-dark">
                        <div class="media">
                            <div class="media-left align-self-center">
                                <i class="${icon} icon-bg-circle"></i>
                            </div>
                            <div class="media-body">
                                <h6 class="media-heading">${category.toUpperCase()}
                                <a class="float-right text-muted" onclick="return dismiss('${id}')">X</a></h6>
                                <p class="notification-text font-small-3 text-muted">${description}</p>
                                <small class="text-muted">
                                ${client} / ${keyword}
                                <a class="float-right p-0 arrow-btn text-dark" href="/clients/takeover/${clientId}">Takeover</a>
                                </small>
                            </div>
                        </div>
                    </a>`;
    $("#notifications-items").append(item);
  }
};

dismiss = (id) => {
  $.ajax({
    type: "GET",
    url: `/notifier/dismiss/${id}`,
    success: (res) => {
      getNotifications();
    },
  });
};

// fix datepickers automatically disappearing on Chrome
$(".selectRange").on("mousedown", function preventClosing(event) {
  event.preventDefault();
});
