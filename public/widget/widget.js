(function () {
  // Function to load CSS dynamically
  function loadCSS(url) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }

  // Function to create and insert HTML
  function createChatbotHTML(chatbotDoc) {
    const chatbotId = chatbotDoc.chatbot._id;
    const domain = chatbotDoc.mlh_widget_domain;
    const isVoiceEnabled = chatbotDoc.chatbot.permissions?.voice ? true : false;
    const chatbotHTML = `
      <!-- START: CHATBOT -->
      <!--button-->
      <div class="widget-chatbox">
      <div id="chat-circle" class="btn btn-raised animated-div">
        <div id="chat-overlay"></div>
        <img class="chat-circle_robot chatbot-avatar" src="${domain}/public/images/ico/favicon.ico"/>
      </div>
    
      <div class="chat-container">
        <!--chat-bot-->
        <div class="chat-box">
          <div class="chat-box-body">
            <!--welcome message-->
            <div class="chat-box-welcome__header intro-bg">
              <div class="chat-box__header-text">
                <p3 class="chat-box-welcome__company-name chatbotName main-color"></p3>
                <span class="chat-box-toggle"><img src="${domain}/public/widget/images/cancel.png"></span>
              </div>
    
              <div id="chat-box-welcome__ava">
                <!--<i class="material-icons">android</i>-->
                <img class="chat-box-welcome_robot chatbot-avatar" src=""/>
              </div>
              <div class="chat-box-welcome__welcome-text">
                <p id="chatbot_description" class="main-color"></p>
              </div>
            </div>
    
            <!--chat-bot after welcome was toggled-->
            <div id="chat-box__wrapper">
              <div class="chat-box-header">
                <span class="chatbotName main-color"></span>
                <span class="chat-box-toggle" style="margin-right: 0px;"><img src="${domain}/public/widget/images/cancel.png"></span>
              </div>
    
              <div class="chat-box-overlay"></div>
              <div class="chat-logs" id="chatMessages">
                <input
                  type="hidden"
                  id="chatbotId"
                  value="${chatbotId}"
                />
                <div id="cm-msg-0" class="chat-bubble">
                  <div id="welcomeMessage"></div>
                </div>
                <div id="cm-offer-container" class="chat-bubble" style="display:none; margin: 10px 0;">
                <div id="cm-offer-offerMessage">🎉 Special Offer for your today! Click Claim below to receive the offer directly to your phone!</div>
                <div id="cm-offer-offerImage"></div>
                <button id="cm-offer-button" class="cm-offer-button" type="button">CLAIM NOW</button>
                </div>
              </div>
              <!--chat-log-->
            </div>
          </div>
          <div class="chat-input-box">
            <form class="chat-input__form">
              <input
                type="text"
                class="chat-input__text"
                id="chat-input__text"
                placeholder="Type your question..."
                autocomplete="off"
              />
              <!-- recordButton -->
              <button type="submit" class="chat-submit" id="chat-submit">
                <img class="chatbot-send-icon" src="${domain}/public/widget/images/send.png">
                ${
                  isVoiceEnabled
                    ? `
                <img src="${domain}/public/widget/images/microphone.png"  id="recordButton">
                <img src="${domain}/public/widget/images/microphone-2.png"  id="stopButton" style="display:none">`
                    : ""
                }
                <!-- <a class="text-muted" href="#!"><i class="fa fa-smile"></i></a> -->
              </button>
            </form>
            <p class="chat-box__sign">powered by <a href="https://mylittlehelper.ai" target="_blank">MyLittleHelper.ai</a></p>
          </div>
        </div>
      </div>
      </div>
      <!-- END: CHATBOT -->`;
    document.body.insertAdjacentHTML("beforeend", chatbotHTML);
  }

  function loadVoice(url) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;

    // For IE
    if (script.readyState) {
      script.onreadystatechange = function () {
        if (this.readyState === "loaded" || this.readyState === "complete") {
          this.onreadystatechange = null;
        }
      };
    } else {
      // For other browsers
      script.onload = function () {};
    }

    document.head.appendChild(script);
  }

  function setStyle(widget) {
    const mainColor = widget.color;
    const bgPrimaryColor = widget.background_primary_color;
    const bgSecondaryColor = widget.background_secondary_color;
    const bgHeaderColor = widget.background_header_color;
    const avatar = widget.avatar;
    const elements = document.querySelectorAll(".main-color");
    elements.forEach((element) => {
      element.style.color = mainColor;
    });

    const elements2 = document.querySelectorAll(".intro-bg");
    elements2.forEach((element) => {
      element.style.background = `linear-gradient(to top left, ${bgPrimaryColor}, ${bgSecondaryColor}`;
    });

    const elements4 = document.querySelectorAll(".chat-box-header");
    elements4.forEach((element) => {
      element.style.background = `${bgHeaderColor}`;
    });

    const elements5 = document.querySelectorAll(".chatbot-avatar");
    elements5.forEach((element) => {
      element.src = `${avatar}`;
    });
  }

  // Function to initialize chatbot functionality
  function initializeChatbot(domain) {
    // Initialize the application
    const chatbotId = document.getElementById("chatbotId").value;

    // Check user browser
    let chatbotUserId = localStorage.getItem("chatbotUserId");

    if (!chatbotUserId) {
      // User is new, create a user on the backend
      console.log(domain + "/widget/new/user");
      try {
        fetch(domain + "/widget/new/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatbotId }),
        })
          .then((response) => {
            if (!response.ok) {
              // If response is not okay (e.g., 404 or 500 error), log the error and stop
              console.error(`Error: ${response.status} ${response.statusText}`);
              return Promise.reject("Server error or incorrect endpoint");
            }
            return response.json(); // Otherwise, parse the response as JSON
          })
          .then((data) => {
            chatbotUserId = data.chatbotUserId;
            localStorage.setItem("chatbotUserId", chatbotUserId); // Store ID in localStorage
            console.log("Welcome, new user!");
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      } catch (error) {
        console.log("SSSS", error);
      }
    } else {
      // User is returning
      console.log("Welcome back, returning user!");
    }

    setTimeout(() => {
      let app = new App(chatbotId);
      app.init();
    }, 1000);

    let $chatCircle,
      $chatBox,
      $chatBoxCloseBtns,
      $chatBoxWelcome,
      $chatWrapper,
      $submitBtn,
      $chatInput;

    const toggleVisibility = ($el, show) => {
      $el.style.transition = "opacity 0.3s";
      $el.style.opacity = show ? 1 : 0;
      setTimeout(() => {
        $el.style.display = show ? "block" : "none";
      }, 300); // Match the duration of the transition
    };

    const hideCircle = (evt) => {
      evt.preventDefault();
      toggleVisibility($chatCircle, false);
      toggleVisibility($chatBox, true);
      toggleVisibility($chatBoxWelcome, true);
    };

    const closeChatBox = (evt) => {
      evt.preventDefault();
      toggleVisibility($chatCircle, true);
      toggleVisibility($chatBox, false);
      toggleVisibility($chatBoxWelcome, false);
      toggleVisibility($chatWrapper, false);
    };

    const openChatMessage = (evt) => {
      evt.preventDefault();
      toggleVisibility($chatBoxWelcome, false);
      toggleVisibility($chatWrapper, true);
    };

    const submitMessage = (evt) => {
      evt.preventDefault();
      const msg = $chatInput.value.trim();
      if (!msg) return;

      // Disable input while processing
      $chatInput.disabled = true;

      const $chatMessages = document.getElementById("chatMessages");
      $chatMessages.insertAdjacentHTML(
        "beforeend",
        `<div class="chat-bubble user-bubble"><div class="user-message">${msg}</div><p class="msg-meta">${formatCurrentTime()}</p></div>`,
      );
      $chatInput.value = "";

      const loadingDots = document.createElement("p");
      loadingDots.className = "chat-bubble bot-bubble bot-message";
      loadingDots.innerHTML = '<span class="loading-dots"></span>';
      $chatMessages.appendChild(loadingDots);
      $chatMessages.scrollTop = $chatMessages.scrollHeight;

      const chatHistory = [];
      const chatBubbles = document.querySelectorAll(".chat-bubble");

      chatBubbles.forEach(function (bubble) {
        const role = bubble.classList.contains("user-bubble") ? "human" : "AI";
        const messageElement = bubble.querySelector(
          ".user-message, .bot-message",
        );
        const message = messageElement ? messageElement.textContent.trim() : "";

        if (role && message) {
          chatHistory.push({ role: role, message: message });
        }
      });

      const chatbotId = document.getElementById("chatbotId").value;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${domain}/query/${chatbotId}`, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          $chatMessages.insertAdjacentHTML(
            "beforeend",
            `<div class="chat-bubble"><div class="bot-message">${response.answer}</div><p class="msg-meta">${formatCurrentTime()}</p></div>`,
          );
        } else {
          console.error("Request failed with status: " + xhr.status);
          $chatMessages.insertAdjacentHTML(
            "beforeend",
            "<p><strong>Bot:</strong> Sorry, there was an error processing your request.</p>",
          );
        }
        loadingDots.remove();
        $chatMessages.scrollTop = $chatMessages.scrollHeight;

        // Re-enable input after processing
        $chatInput.disabled = false;
      };

      xhr.onerror = () => {
        console.error("Request failed due to a network error.");
        $chatMessages.insertAdjacentHTML(
          "beforeend",
          "<p><strong>Bot:</strong> Sorry, there was an error processing your request.</p>",
        );
        loadingDots.remove();
        $chatMessages.scrollTop = $chatMessages.scrollHeight;

        // Re-enable input after processing
        $chatInput.disabled = false;
      };

      xhr.send(
        JSON.stringify({
          question: msg,
          chatHistory,
          chatbotUserId: localStorage.getItem("chatbotUserId"),
        }),
      );
    };

    const handleKeyPress = (evt) => {
      if (evt.key === "Enter") submitMessage(evt);
    };

    const init = () => {
      $chatCircle = document.getElementById("chat-circle");
      $chatBox = document.querySelector(".chat-box");
      $chatBoxCloseBtns = document.querySelectorAll(".chat-box-toggle");
      $chatForm = document.querySelector(".chat-input__form");
      $chatBoxWelcome = document.querySelector(".chat-box-welcome__header");
      $chatWrapper = document.getElementById("chat-box__wrapper");
      $chatInput = document.getElementById("chat-input__text");
      $chatInput = document.getElementById("chat-input__text");
      $submitBtn = document.getElementById("chat-submit");

      $chatCircle.addEventListener("click", hideCircle);
      $chatBoxCloseBtns.forEach((button) =>
        button.addEventListener("click", closeChatBox),
      );
      $chatInput.addEventListener("click", openChatMessage);
      $chatForm.addEventListener("click", openChatMessage);
      $submitBtn.addEventListener("click", submitMessage);
      $chatInput.addEventListener("keypress", handleKeyPress);
      const widget = window.chatbot.webWidget;
      if (window.chatbot && window.chatbot) {
        console.log(widget.name);
        document.querySelectorAll(".chatbotName").forEach((e) => {
          e.textContent = widget.name;
        });

        document.querySelector("#chatbotId").value = widget.chatbot;
        document.querySelector("#chatbot_description").innerHTML =
          widget.description;
        document.querySelector("#welcomeMessage").innerHTML =
          widget.greeting_message;
      }

      if (chatbot.offer) {
        document.querySelector("#cm-offer-container").style.display = "block";
        // document.querySelector("#cm-offer-offerMessage").innerHTML =
        //  chatbot.offer.offer_message;
        document.querySelector("#cm-offer-offerImage").innerHTML =
          `<img style="width: 100%; margin: 10px 0;" src="${chatbot.offer.offer_image}">`;

        // offers
        document
          .getElementById("cm-offer-button")
          .addEventListener("click", function () {
            document.getElementById("cm-offer-button").style.display = "none";
            // Create offer div
            let offerDiv = `<div class="chat-bubble">
              <p>Enter your phone number*</p>
              <input type="tel" id="cm-offer-phoneNumber" placeholder="Enter phone number" required>
              <button id="submitOffer"  class="cm-offer-button" type="button">Submit</button>
              <p class="marketing-info">By subscribing, you consent to receive up to 6 sms or mms marketing messages per month. Reply STOP to opt out. Reply Help for help.</p>
              <p id="errorMessage" style="color: red; display: none;">Please enter a valid phone number.</p>
              </div>
            `;

            // Append to chatMessages
            document.getElementById("chatMessages").innerHTML += offerDiv;
            scrollToBottom();

            // Add event listener to submit button
            document
              .getElementById("submitOffer")
              .addEventListener("click", function () {
                let phoneInput = document.getElementById(
                  "cm-offer-phoneNumber",
                );
                let errorMessage = document.getElementById("errorMessage");
                let phoneNumber = phoneInput.value.trim();

                // Basic phone validation (adjust as needed)
                let phoneRegex = /^\+?[1-9]\d{7,14}$/; // Accepts international formats
                if (!phoneRegex.test(phoneNumber)) {
                  errorMessage.style.display = "block";
                  return;
                }

                errorMessage.style.display = "none";

                // AJAX request
                let xhr = new XMLHttpRequest();
                xhr.open("POST", "/widget/offer", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.onreadystatechange = function () {
                  if (xhr.readyState === 4 && xhr.status === 200) {
                    let response = JSON.parse(xhr.responseText);
                    console.log("response", response);
                    // Append response to chatMessages
                    let responseDiv = `<div class="chat-bubble" style="margin: 10px 0px">
                   ${response.message || "Something went wrong! please try again later"}
                    </div>`;
                    document.getElementById("chatMessages").innerHTML +=
                      responseDiv;
                    scrollToBottom();
                  }
                };
                xhr.send(
                  JSON.stringify({
                    phone: phoneNumber,
                    chatbot: chatbot.chatbot._id,
                  }),
                );
              });
          });
      }

      setStyle(widget);
    };

    init();
  }

  function scrollToBottom() {
    let chatMessages = document.getElementById("chatMessages");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Load CSS and create HTML content
  console.log(window.chatbot.mlh_widget_domain);
  loadCSS(`${window.chatbot.mlh_widget_domain}/public/widget/widget.css`);
  loadVoice(`${window.chatbot.mlh_widget_domain}/public/widget/voice.js`);
  createChatbotHTML(window.chatbot);
  initializeChatbot(window.chatbot.mlh_widget_domain);
})();
