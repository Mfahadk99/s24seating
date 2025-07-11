// Render Cards
const showKnowledgeBaseCards = (selectedChatbotId) => {
  const $knowledgeBaseContainer = $("#knowledgeBaseContainer");
  $knowledgeBaseContainer.empty(); // Clear old content

  $.ajax({
    url: "/knowledge-base/data",
    data: { chatbotId: selectedChatbotId },
    cache: true,
    success: function (data) {
      if (!data.length)
        showInstruction("Click on <strong>Scan</strong> to add new knowledge");

      data.forEach((item) => {
        const card = createCard(item);
        $knowledgeBaseContainer.append(card);
      });

      $("#answerFilter").val("answered"); // filter initially by answered
      filterCards();
    },
    error: function (err) {
      console.log(err);
    },
    beforeSend: function () {
      $("#chatbotSelect").prop("disabled", true);
    },
    complete: function () {
      $("#chatbotSelect").prop("disabled", false);
    },
  });
};

const createCard = (item) => {
  const hasAnswer = extractAnswer(item.content).trim().length > 0; // Check if the card has an answer
  const borderClass = hasAnswer ? "#28d094" : "#ff4961"; // Assign border class
  return `
          <div class="col-lg-4 col-md-6 knowledge-card" 
            data-title="${encodeContent(item.title).toLowerCase()}" 
            data-content="${extractAnswer(item.content).toLowerCase()}"
            data-has-answer="${extractAnswer(item.content).trim().length > 0}" id="card${item._id}">
            <div class="card" style="border-left: 2px solid ${borderClass}">
                <div class="card-header custom-card-header d-flex justify-content-between align-items-center">
                    <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        value="${encodeContent(item.title)}" 
                        id="question-${item._id}" 
                    />
                    <button 
                        class="btn btn-sm btn-outline-secondary ml-2" 
                        type="button" 
                        data-toggle="collapse" 
                        data-target="#collapse-${item._id}" 
                        aria-expanded="false" 
                        aria-controls="collapse-${item._id}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="collapse" id="collapse-${item._id}">
                    <div class="card-body">
                        <textarea 
                            class="form-control" 
                            rows="7" 
                            id="answer-${item._id}">${extractAnswer(item.content)}</textarea>
                    </div>
                    <div class="card-footer">
                        <span class="left">
                        <button class="btn btn-outline-secondary bold btn-sm search-btn" onclick="searchAnswer('${item._id}')">Search <i class="fa fa-search"></i></button>
                        </span>
                        <span class="ml-auto">
                            <button class="btn btn-outline-dark bold btn-sm" onclick="deleteItem('${item._id}')">Delete</button>
                            <button class="btn btn-outline-primary bold btn-sm" onclick="saveItem('${item._id}')">Save</button>
                        </span>
                    </div>
                </div>
            </div>
          </div>`;
};

// Filter Cards
const filterCards = () => {
  const keyword = $("#filterInput").val().toLowerCase();
  const filterStatus = $("#answerFilter").val();

  $(".knowledge-card").each(function () {
    const title = $(this).data("title").toLowerCase();
    const content = $(this).data("content").toLowerCase();
    const hasAnswer = $(this).data("has-answer");

    // Check if the card matches the keyword filter in title or content
    const matchesKeyword = title.includes(keyword) || content.includes(keyword);

    // Check if the card matches the status filter
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "answered" && hasAnswer) ||
      (filterStatus === "not-answered" && !hasAnswer);

    // Show the card if it matches both filters
    if (matchesKeyword && matchesStatus) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
};

//
function searchAnswer(id) {
  $.ajax({
    url: `/knowledge-base/search/${id}`,
    method: "GET", // or 'POST' depending on your API
    success: function (response) {
      const answerText = response; // Adjust based on your actual API response structure
      $(`#answer-${id}`).val(answerText); // Set the retrieved answer in the textarea
    },
    error: function (xhr, status, error) {
      console.error("Search failed:", error);
    },
  });
}

// Function to extract the Answer (A) part
function extractAnswer(content) {
  const answer = content.split("A:")[1]?.trim(); // Get text after 'A:'
  return answer || " "; // Fallback if no 'A:' is found
}

const truncateContent = (content, limit = 20) => {
  const encodedData = $("<div/>").text(content).html();
  return encodedData.length > limit
    ? encodedData.substr(0, limit) + "..."
    : encodedData;
};

// $('[data-toggle="tooltip"]').tooltip();

const encodeContent = (content) => {
  return $("<div/>").text(content).html();
};

// get the related data on select change
$("#chatbotSelect")
  .change(function () {
    const selectedChatbotId = $(this).val();
    // get the related chatbot data
    if (selectedChatbotId) {
      $("#addCardContainer").show();
      showKnowledgeBaseCards(selectedChatbotId);
    }
  })
  .change(); // is added to call it initially

function pollProgress() {
  const interval = setInterval(() => {
    fetch(`/knowledge-base/progress/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data) $("#progressContainer").show();
        // $('#progressText').text(data.progress + '%');
        if (!data.status || data.status === "completed") {
          $("#progressContainer").hide();
          clearInterval(interval); // Stop polling when completed
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        clearInterval(interval); // Stop polling in case of error
        alert(
          "An error occurred while fetching progress. Please try again later.",
        );
      });
  }, 1000);
}

pollProgress();

function previewChatbot() {
  const chatbotId = $("#chatbotSelect").val();

  // Check if chatbotId is valid
  if (chatbotId) {
    // Construct the URL
    const url = `/preview/${chatbotId}`;

    // Open the URL in a new tab
    window.open(url, "_blank");
  } else {
    showInstruction("Please select a chatbot");
    console.error("Chatbot ID is not provided.");
  }
}

function showInstruction(instruction) {
  $("#instructionText").html(instruction);
  $("html, body").animate(
    {
      scrollTop: $("#instructionDiv").offset().top,
    },
    "slow",
  );
  $("#instructionDiv").fadeIn(500);
  // After 10 seconds, hide the instruction
  setTimeout(function () {
    $("#instructionDiv").fadeOut("slow");
  }, 10000);
}

function saveItem(id) {
  const updatedQuestion = $(`#question-${id}`).val();
  const updatedAnswer =
    "Q: " + updatedQuestion + " A: " + $(`#answer-${id}`).val();
  $.ajax({
    url: "/knowledge-base/entries/" + id,
    method: "PUT",
    data: { title: updatedQuestion, content: updatedAnswer },
    dataType: "json",
    cache: true,
    success: function (data) {
      $("#alertDiv").show();
      $("#alertBox")
        .removeClass("alert-warning alert-danger alert-success")
        .addClass("alert-success");
      $("#alertMsg").text("The question is updated successfully!");
    },
    error: function (err) {
      console.log(err);
    },
    beforeSend: function () {
      $("#chatbotSelect").prop("disabled", true);
    },
    complete: function () {
      $("#chatbotSelect").prop("disabled", false);
    },
  });
}

function deleteItem(id) {
  $.ajax({
    url: "/knowledge-base/entries/" + id,
    method: "DELETE",
    dataType: "json",
    cache: true,
    success: function (data) {
      console.log("data", data);
      $(`#card${id}`).remove();

      $("#alertBox")
        .removeClass("alert-warning alert-danger alert-success")
        .addClass("alert-success");
      $("#alertMsg").text("The card is removed successfully!");
    },
    error: function (err) {
      console.log(err);
    },
    beforeSend: function () {
      $("#alertDiv").show();
      $("#alertBox")
        .removeClass("alert-warning alert-danger alert-success")
        .addClass("alert-warning");
      $("#alertMsg").text("Removing your card ...");
    },
    complete: function () {
      $("#chatbotSelect").prop("disabled", false);
    },
  });
}
