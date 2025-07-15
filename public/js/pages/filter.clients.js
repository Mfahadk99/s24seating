jQuery(document).ready(function () {
  $("#filterForm").submit();
  /*
        $("#startDateInput").datepicker({
            dateFormat: "mm/dd/yy",
            maxDate: '0',
            changeYear: true,
            changeMonth: true,
            onSelect: function (selected) {
                if ($("#endDateInput")) {
                    $("#endDateInput").datepicker("option", "minDate", selected);
                }
            }
        });

        $("#endDateInput").datepicker({
            dateFormat: "mm/dd/yy",
            maxDate: '0',
            changeYear: true,
            changeMonth: true,
            onSelect: function (selected) {
                if ($("#startDateInput")) {
                    $("#startDateInput").datepicker("option", "maxDate", selected);
                }
            }
        });
    */
});

let alertDiv = document.getElementById("alertDiv");

let formAction = `/clients/filter`;

function submitForm(page = null) {
  $("#filterForm").attr("action", `${formAction}?page=${page}`);
  $("#filterForm").submit();
}
$("#filterForm").submit(function (e) {
  e.preventDefault(); // avoid to execute the actual submit of the form.
  var form = $(this);
  var url = form.attr("action");
  document.getElementById("wrapper").style.opacity = 0.3;
  document.getElementById("loader").style.opacity = 1;
  $.ajax({
    type: "POST",
    url: url,
    data: form.serialize(), // serializes the form's elements.
    success: function (data) {
      console.log(data);
      form.attr("action", formAction);
      createUserElements(data.clients);
      createPagination(data.pagination);
      $("#totalResult").html(`Total results: ${data.pagination.totalResults}`);
      $("#paginationDiv").attr("data-page", data.pagination.pageNumber);
      toggleNavigationBtn(data.pagination);
      document.getElementById("wrapper").style.opacity = 1;
      document.getElementById("loader").style.opacity = 0;
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      form.attr("action", formAction);
      scrollTo("#alertDiv");
      showAlert(alertDiv, "error", "Something went wrong! Try again later.");
      console.log("error in ajaxFormSubmit: errorThrown", errorThrown);
      document.getElementById("wrapper").style.opacity = 1;
      document.getElementById("loader").style.opacity = 0;
    },
  });
});

/**
 * paginationObj: { pageNumber, perPage, totalResults }
 */
function createPagination(paginationObj) {
  let totalPages =
    paginationObj.totalResults && paginationObj.perPage
      ? paginationObj.totalResults / paginationObj.perPage
      : 0;
  if (!totalPages) return;

  let currentPage = paginationObj.pageNumber;

  let paginationElement = ``;
  paginationElement += `
    <nav aria-label="Page navigation">
                <ul class="pagination justify-content-center pagination-separate pagination-round">
                    <li class="page-item" id="prevBtn" onclick="changePage(this)">
                        <a class="page-link" aria-label="Previous">
                            <span aria-hidden="true">« Prev</span>
                            <span class="sr-only">Previous</span>
                        </a>
                    </li>
    `;

  let firstPage = null;
  let lastPage = null;
  let isOverflowed = false;
  let lastPages = [];
  if (totalPages > 6) {
    firstPage = currentPage - 2 > 0 ? currentPage - 2 : currentPage;
    lastPage = totalPages - currentPage > 2 ? currentPage + 2 : totalPages;
    if (totalPages > 8) {
      isOverflowed = true;
      lastPages.push(totalPages - 1);
      lastPages.push(totalPages);
    }
  } else {
    firstPage = 1;
    lastPage = totalPages;
  }
  for (let i = firstPage; i < lastPage + 1; i++) {
    if (lastPages.includes(i)) {
      let index = lastPages.indexOf(i);
      if (index > -1) {
        lastPages.splice(index, 1);
      }
    }
    let activeClass = "";
    if (i == paginationObj.pageNumber) {
      activeClass = "active";
    }
    paginationElement += `<li class="page-item ${activeClass}" onclick="submitForm(${i})"><a class="page-link">${i}</a></li>`;
  }

  if (isOverflowed && lastPages.length > 1) {
    paginationElement += `<li class="page-item"><a class="page-link">...</a></li>`;
    lastPages.forEach((i) => {
      let activeClass = "";
      if (i == paginationObj.pageNumber) {
        activeClass = "active";
      }
      paginationElement += `<li class="page-item ${activeClass}" onclick="submitForm(${i})"><a class="page-link">${i}</a></li>`;
    });
  }

  paginationElement += `
    <li class="page-item" id="nextBtn" onclick="changePage(this)">
                        <a class="page-link" aria-label="Next">
                            <span aria-hidden="true">Next »</span>
                            <span class="sr-only">Next</span>
                        </a>
                    </li>
                </ul>
            </nav>
    `;

  document.getElementById("paginationDiv").innerHTML = paginationElement;
}

/**
 * paginationObj: { pageNumber, perPage, totalResults }
 */
function toggleNavigationBtn(paginationObj) {
  $("#prevBtn").removeClass("disabled").attr("onclick", "changePage(this)");
  $("#nextBtn").removeClass("disabled").attr("onclick", "changePage(this)");
  if (paginationObj.pageNumber == 1) {
    // disable prevBtn
    $("#prevBtn").addClass("disabled").attr("onclick", null);
  }
  if (
    paginationObj.pageNumber ==
    Math.ceil(paginationObj.totalResults / paginationObj.perPage)
  ) {
    // disable nextBtn
    $("#nextBtn").addClass("disabled").attr("onclick", null);
  }
}

function changePage(e) {
  let pageNumber = Number($("#paginationDiv").attr("data-page"));
  if (e.id === "nextBtn") {
    pageNumber += 1;
  } else {
    pageNumber -= 1;
  }

  submitForm(pageNumber);
}

function createUserElements(data) {
  document.getElementById("userDiv").innerHTML = ``;
  for (let i = 0; data && i < data.length; i++) {
    const user = data[i];

    let profileImage = user.image_url
      ? user.image_url
      : "/public/images/default-profile.png";
    let fullName = user.firstname + " " + user.lastname;

    let lastVisitDate = user.last_visit_date || "";
    var borderColor = "#ff9149"; // default is inactive account
    if (lastVisitDate) {
      // check if last login less than a month ago
      if (
        (new Date().getTime() - new Date(lastVisitDate).getTime()) /
          (1 * 24 * 60 * 60 * 1000) <=
        30
      )
        borderColor = "#28d094";
    }

    let name = fullName.length > 12 ? fullName.substr(0, 12) + "." : fullName;

    let restaurantElement = ``;
    if (user.restaurants && user.restaurants.length > 0) {
      restaurantElement += `<div id="collapse${user._id}" class="collapse hide">`;
      restaurantElement += `<table class="mt-2" style="width: 100%">
                            <thead>
                                <tr>
                                    <th class="pb-1">Restaurants</th>
                                    <th class="text-center pb-1"></th>
                                </tr>
                            </thead>
                          <tbody>`;
      user.restaurants.forEach((restaurant) => {
        restaurantElement += `
                            <tr>
                                <td class="text-left pb-1">${restaurant.name} <br><a href="#">${restaurant.phone}</a></td>
                                <td class="text-center py-1"></td>
                            </tr>    
                    `;
      });
      restaurantElement += `
                    </tbody>
                </table>
            `;
      restaurantElement += `</div>`;
    } else {
      // restaurantElement += `<h3 class="text-danger mt-2">No restaurant found!</h3>`;
    }

    let individualElement = `
        <div class="col-lg-4 col-md-6 pt-1 px-2 ">
          <div class="row profile-card p-1 pl-0 box-shadow-4" style="border-left: 2px solid ${borderColor}">
            <div class="col-4 column-center">
              <img class="imgCenter" src="${profileImage}">
            </div>
            <div class="col-8 pl-2">
              <h3 style="text-transform: capitalize; padding-top: 2px; overflow:hidden; 
                        white-space:nowrap; text-overflow: ellipsis; color: #000;">${name}</h3>
              
              <h5 class="keyword-badge" data-toggle="collapse" data-target="#collapse${
                user._id
              }" aria-expanded="true" aria-controls="collapse${user._id}">
              ${
                user.restaurants && user.restaurants.length ? user.restaurants.length : 0
              } Restaurants 
              <br>
              </h5>

              <a href="/clients/takeover/${user._id}">
                <button type="button" class="btn btn-sm btn-outline-success float-right">
                  <i class="fa fa-user-secret" aria-hidden="true"></i> Takeover
                </button>
              </a>
            </div>

            <div class="col-6">
              ${restaurantElement}
            </div>
            <div class="option-div text-right">
              <a href="" class="option-dots" data-toggle="dropdown" aria-haspopup="true"
                aria-expanded="false"><i class="fa fa-ellipsis-v"></i>
              </a>
              <div class="dropdown-menu" x-placement="bottom-start" style="position: absolute; will-change: transform; top: 0px; left: 0px; transform: translate3d(0px, 40px, 0px); min-width: auto;">
                <a href="/clients/view/${user._id}">
                  <button class="dropdown-item" type="button"><i class="fa fa-eye text-success action-icon" aria-hidden="true"></i> View
                  </button>
                </a>
                <a href="/clients/edit/${user._id}">
                  <button class="dropdown-item" type="button"><i class="fa fa-pencil-square-o text-info action-icon" aria-hidden="true"></i> Edit
                  </button>
                </a>
                <a href="/clients/takeover/${user._id}">
                  <button class="dropdown-item" type="button">
                    <i class="fa fa-user-secret text-warning action-icon" aria-hidden="true"></i> Takeover
                  </button>
                </a>
                <button class="dropdown-item" data-name="${fullName}" data-id="${user._id}" type="button" data-toggle="modal" data-target="#deleteModal" onclick="deleteUser(this)">
                  <i class="fa fa-trash text-danger action-icon" aria-hidden="true"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        `;
    // document.getElementById('userDiv').innerHTML += individualElement;
    document
      .getElementById("userDiv")
      .insertAdjacentHTML("beforeend", individualElement);
  }
}

function deleteUser(e) {
  let userID = e.getAttribute("data-id");
  let userName = e.getAttribute("data-name");
  document
    .querySelector("#deleteForm")
    .setAttribute("action", `/clients/${userID}?_method=DELETE`);
  document.querySelector("#msg").innerHTML =
    `Do you want to remove ${userName}?`;
}

$(".searchForm-inp").on("input", function () {
  $("#userNameInput").val($("#clientNameInput").val());
  $("#chatbotInput").val($("#chatbotNameInput").val());
  $("#callAgentInput").val($("#callAgentNameInput").val());
  $("#accountStatusInputFilter").val($("#accountStatusInput").val());

  $("#filterForm").submit();
});
