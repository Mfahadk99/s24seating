// Parts copied from https://github.com/chris-rudmin/Recorderjs
let BYTES_PER_SAMPLE = 2;
let recorded = [];

function encode(buffer) {
  let length = buffer.length;
  let data = new Uint8Array(length * BYTES_PER_SAMPLE);
  for (let i = 0; i < length; i++) {
    let index = i * BYTES_PER_SAMPLE;
    let sample = buffer[i];
    if (sample > 1) {
      sample = 1;
    } else if (sample < -1) {
      sample = -1;
    }
    sample = sample * 32768;
    data[index] = sample;
    data[index + 1] = sample >> 8;
  }
  recorded.push(data);
}

function dump(sampleRate) {
  let bufferLength = recorded.length ? recorded[0].length : 0;
  let length = recorded.length * bufferLength;
  let wav = new Uint8Array(44 + length);

  let view = new DataView(wav.buffer);

  // RIFF identifier 'RIFF'
  view.setUint32(0, 1380533830, false);
  // file length minus RIFF identifier length and file description length
  view.setUint32(4, 36 + length, true);
  // RIFF type 'WAVE'
  view.setUint32(8, 1463899717, false);
  // format chunk identifier 'fmt '
  view.setUint32(12, 1718449184, false);
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * BYTES_PER_SAMPLE, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, BYTES_PER_SAMPLE, true);
  // bits per sample
  view.setUint16(34, 8 * BYTES_PER_SAMPLE, true);
  // data chunk identifier 'data'
  view.setUint32(36, 1684108385, false);
  // data chunk length
  view.setUint32(40, length, true);

  for (var i = 0; i < recorded.length; i++) {
    wav.set(recorded[i], i * bufferLength + 44);
  }

  recorded = [];
  let msg = [wav.buffer];
  postMessage(msg, [msg[0]]);
}

onmessage = function (e) {
  if (e.data[0] === "encode") {
    encode(e.data[1]);
  } else if (e.data[0] === "dump") {
    dump(e.data[1]);
  } else if (e.data[0] === "close") {
    self.close();
  }
};

class RecorderService {
  constructor(chatbotId) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    this.em = document.createDocumentFragment();

    this.state = "inactive";

    this.chunks = [];
    this.chunkType = "";

    this.encoderMimeType = "audio/wav";
    this.chatbotId = chatbotId;
    this.config = {
      manualEncoderId: "wav",
      micGain: 1.0,
      processorBufferSize: 2048,
      stopTracksAndCloseCtxWhenFinished: true,
      usingMediaRecorder: typeof window.MediaRecorder !== "undefined",
      //userMediaConstraints: { audio: true }
      userMediaConstraints: { audio: { echoCancellation: false } },
    };
  }

  /* Returns promise */
  startRecording() {
    if (this.state !== "inactive") {
      return;
    }

    // This is the case on ios/chrome, when clicking links from within ios/slack (sometimes), etc.
    if (
      !navigator ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      alert("Missing support for navigator.mediaDevices.getUserMedia"); // temp: helps when testing for strange issues on ios/safari
      return;
    }

    this.audioCtx = new AudioContext();
    this.micGainNode = this.audioCtx.createGain();
    this.outputGainNode = this.audioCtx.createGain();

    // If not using MediaRecorder(i.e. safari and edge), then a script processor is required. It's optional
    // on browsers using MediaRecorder and is only useful if wanting to do custom analysis or manipulation of
    // recorded audio data.
    if (!this.config.usingMediaRecorder) {
      this.processorNode = this.audioCtx.createScriptProcessor(
        this.config.processorBufferSize,
        1,
        1,
      ); // TODO: Get the number of channels from mic
    }

    // Create stream destination on chrome/firefox because, AFAICT, we have no other way of feeding audio graph output
    // in to MediaRecorder. Safari/Edge don't have this method as of 2018-04.
    if (this.audioCtx.createMediaStreamDestination) {
      this.destinationNode = this.audioCtx.createMediaStreamDestination();
    } else {
      this.destinationNode = this.audioCtx.destination;
    }

    // Create web worker for doing the encoding
    if (!this.config.usingMediaRecorder) {
      console.log("SSSSSSSSSSS");
      this.encoderWorker = new Worker(
        "https://dev.mylittlehelper.ai/public/widget/voice/encoder-wav-worker.js",
      );
      this.encoderMimeType = "audio/wav";

      this.encoderWorker.addEventListener("message", (e) => {
        let event = new Event("dataavailable");
        event.data = new Blob(e.data, { type: this.encoderMimeType });
        this._onDataAvailable(event);
      });
    }

    // This will prompt user for permission if needed
    return navigator.mediaDevices
      .getUserMedia(this.config.userMediaConstraints)
      .then((stream) => {
        this._startRecordingWithStream(stream);
      })
      .catch((error) => {
        alert("Error with getUserMedia: " + error.message); // temp: helps when testing for strange issues on ios/safari
        console.log(error);
      });
  }

  _startRecordingWithStream(stream) {
    this.micAudioStream = stream;

    this.inputStreamNode = this.audioCtx.createMediaStreamSource(
      this.micAudioStream,
    );
    this.audioCtx = this.inputStreamNode.context;

    // Allow optionally hooking in to audioGraph inputStreamNode, useful for meters
    if (this.onGraphSetupWithInputStream) {
      this.onGraphSetupWithInputStream(this.inputStreamNode);
    }

    this.inputStreamNode.connect(this.micGainNode);
    this.micGainNode.gain.setValueAtTime(
      this.config.micGain,
      this.audioCtx.currentTime,
    );

    let nextNode = this.micGainNode;

    this.state = "recording";

    if (this.processorNode) {
      nextNode.connect(this.processorNode);
      this.processorNode.connect(this.outputGainNode);
      this.processorNode.onaudioprocess = (e) => this._onAudioProcess(e);
    } else {
      nextNode.connect(this.outputGainNode);
    }

    this.outputGainNode.connect(this.destinationNode);

    if (this.config.usingMediaRecorder) {
      this.mediaRecorder = new MediaRecorder(this.destinationNode.stream);
      this.mediaRecorder.addEventListener("dataavailable", (evt) =>
        this._onDataAvailable(evt),
      );
      this.mediaRecorder.addEventListener("error", (evt) => this._onError(evt));

      this.mediaRecorder.start();
    } else {
      // Output gain to zero to prevent feedback. Seems to matter only on Edge, though seems like should matter
      // on iOS too.  Matters on chrome when connecting graph to directly to audioCtx.destination, but we are
      // not able to do that when using MediaRecorder.
      this.outputGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    }
  }

  _onAudioProcess(e) {
    if (this.config.broadcastAudioProcessEvents) {
      this.em.dispatchEvent(
        new CustomEvent("onaudioprocess", {
          detail: {
            inputBuffer: e.inputBuffer,
            outputBuffer: e.outputBuffer,
          },
        }),
      );
    }

    // Safari and Edge require manual encoding via web worker. Single channel only for now.
    // Example stereo encoderWav: https://github.com/MicrosoftEdge/Demos/blob/master/microphone/scripts/recorderworker.js
    if (!this.config.usingMediaRecorder) {
      if (this.state === "recording") {
        if (this.config.broadcastAudioProcessEvents) {
          this.encoderWorker.postMessage([
            "encode",
            e.outputBuffer.getChannelData(0),
          ]);
        } else {
          this.encoderWorker.postMessage([
            "encode",
            e.inputBuffer.getChannelData(0),
          ]);
        }
      }
    }
  }

  stopRecording() {
    if (this.state === "inactive") {
      return;
    }

    this.state = "inactive";

    // Use MediaRecorder to stop recording
    if (this.config.usingMediaRecorder) {
      this.mediaRecorder.stop();
    } else {
      this.encoderWorker.postMessage(["dump", this.audioCtx.sampleRate]);
    }
  }

  // Handle the data available from media recorder
  _onDataAvailable(evt) {
    this.chunks.push(evt.data);
    this.chunkType = evt.data.type;

    if (this.state !== "inactive") {
      return;
    }

    let blob = new Blob(this.chunks, { type: this.chunkType });
    let blobUrl = URL.createObjectURL(blob);
    const recording = {
      ts: new Date().getTime(),
      blobUrl: blobUrl,
      mimeType: blob.type,
      size: blob.size,
    };

    this.chunks = [];
    this.chunkType = null;

    if (this.destinationNode) {
      this.destinationNode.disconnect();
      this.destinationNode = null;
    }
    if (this.outputGainNode) {
      this.outputGainNode.disconnect();
      this.outputGainNode = null;
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.encoderWorker) {
      this.encoderWorker.postMessage(["close"]);
      this.encoderWorker = null;
    }
    if (this.micGainNode) {
      this.micGainNode.disconnect();
      this.micGainNode = null;
    }
    if (this.inputStreamNode) {
      this.inputStreamNode.disconnect();
      this.inputStreamNode = null;
    }

    if (this.config.stopTracksAndCloseCtxWhenFinished) {
      this.micAudioStream.getTracks().forEach((track) => track.stop());
      this.micAudioStream = null;

      this.audioCtx.close();
      this.audioCtx = null;
    }

    // Send the audio blob as a query to your API
    this.sendQuery(blob, this.chatbotId)
      .then((response) => {
        // Handle the response from the API
        console.log("Response from server:", response);
        // Display or handle the reply as needed
        this.displayReply(response);
      })
      .catch((error) => {
        console.error("Error sending query:", error);
      });

    this.em.dispatchEvent(
      new CustomEvent("recording", { detail: { recording: recording } }),
    );
  }

  // Function to send the recorded audio blob as a query
  async sendQuery(blob, chatbotId) {
    console.log("sendQuery", blob);
    const formData = new FormData();
    formData.append("audio", blob, "recording.wav"); // Adjust the key as per your API requirement
    console.log(chatbotId);
    const response = await fetch(`/query/audio/${chatbotId}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json(); // Adjust as per the expected response format
  }

  // Function to display or handle the reply
  displayReply(response) {
    // Log the API response for debugging
    console.log("Reply from API:", response);

    // Check if the response contains audio content
    if (response.audioContent) {
      // Create a Blob from the base64 string
      const audioData = response.audioContent; // base64-encoded string
      const links = response.links || [];
      // Convert base64 string to binary
      const byteCharacters = atob(audioData); // Decode base64
      const byteNumbers = new Array(byteCharacters.length);

      // Convert to byte array
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      // Create a Blob from Uint8Array
      const audioBlob = new Blob([byteArray], { type: "audio/wav" }); // Change MIME type as needed

      // Generate a URL for the audio blob
      const audioUrl = URL.createObjectURL(audioBlob);

      // remove loading
      document.getElementById("MLHLoadingContainer").remove();

      // Append the audio element into the UI as part of the bot response
      const linksHtml = formatLinks(links);
      const $chatMessages = document.getElementById("chatMessages");
      $chatMessages.insertAdjacentHTML(
        "beforeend",
        `<div class="chat-bubble bot-bubble">
            <div class="bot-message">
              <audio controls src="${audioUrl}"></audio>
              <div class="links-container">
                ${linksHtml}
              </div>
              <p class="msg-meta">${formatCurrentTime()}</p>
            </div>
         </div>`,
      );

      // Optionally, autoplay the audio
      const audio = new Audio(audioUrl);
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    } else {
      console.log("No audio content in the response.");
      // Handle the case where no audio is returned
    }
  }

  _onError(evt) {
    console.log("error", evt);
    this.em.dispatchEvent(new Event("error"));
    alert("error:" + evt); // for debugging purposes
  }
}

("use strict");

class App {
  constructor(chatbotId) {
    this.btnRecord = document.getElementById("recordButton");
    this.btnStop = document.getElementById("stopButton"); // FIX:

    // TODO: this.debugTxt = document.getElementById("debug-txt");

    this.recordingsCont = document.getElementById("chatMessages");

    this.isRecording = false;
    this.saveNextRecording = false;
    this.chatbotId = chatbotId;
    document.getElementById("recordButton").style.display = "inline";
    document.getElementById("stopButton").style.display = "none";
    // TODO: this.debugTxt.innerHTML = "stopped";
  }

  init() {
    this._initEventListeners();
  }

  _initEventListeners() {
    this.btnRecord.addEventListener("click", (evt) => {
      this._stopAllRecording();
      this.saveNextRecording = true;
      this._startRecording();

      this.btnRecord.disabled = true;
      this.btnStop.disabled = false;
      // TODO: this.debugTxt.innerHTML = "recording";
      document.getElementById("recordButton").style.display = "none";
      document.getElementById("stopButton").style.display = "inline";
    });

    this.btnStop.addEventListener("click", (evt) => {
      this._stopAllRecording();

      this.btnRecord.disabled = false;
      this.btnStop.disabled = true;
      // TODO: this.debugTxt.innerHTML = "stopped";
      document.getElementById("recordButton").style.display = "inline";
      document.getElementById("stopButton").style.display = "none";
    });
  }

  _startRecording() {
    if (!this.recorderSrvc) {
      this.recorderSrvc = new RecorderService(this.chatbotId);
      this.recorderSrvc.em.addEventListener("recording", (evt) =>
        this._onNewRecording(evt),
      );
    }

    this.recorderSrvc.startRecording();
    this.isRecording = true;
    document.getElementById("recordButton").style.display = "none";
    document.getElementById("stopButton").style.display = "inline";
    // TODO: this.debugTxt.innerHTML = "recording...";
  }

  _stopAllRecording() {
    if (this.recorderSrvc && this.isRecording) {
      this.recorderSrvc.stopRecording();
      this.isRecording = false;

      if (this.meterNodeRaw) {
        this.meterNodeRaw.disconnect();
        this.meterNodeRaw = null;
        this.meterEl.innerHTML = "";
      }
    }
  }

  _onNewRecording(evt) {
    if (!this.saveNextRecording) {
      return;
    }
    const newIdx = this.recordingsCont.childNodes.length + 1;

    this.recordingsCont.insertAdjacentHTML(
      "beforeend",
      `<div class="chat-bubble user-bubble">
    <div class="user-message">
      <audio id="audio-recording-${newIdx}"  controls src="${evt.detail.recording.blobUrl}" type="${evt.detail.recording.mimeType}"></audio>
      <p class="msg-meta">${formatCurrentTime()}</p>
    </div>
  </div>`,
    );

    const loadingDots = document.createElement("p");
    loadingDots.id = "MLHLoadingContainer";
    loadingDots.classList.add("chat-bubble", "bot-bubble", "bot-message");

    const spanElement = document.createElement("span");
    spanElement.classList.add("loading-dots");
    loadingDots.appendChild(spanElement);

    this.recordingsCont.appendChild(loadingDots);
    this.recordingsCont.scrollTop = this.recordingsCont.scrollHeight;
  }
}

const formatLinks = (links) => {
  // Basic URL validation regex, expanded to include tel: and mailto:
  let linkRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*|tel:[^\s]*|mailto:[^\s]*)$/i;

  // Remove duplicate links using an object
  let uniqueLinks = [];
  let seen = {};
  for (let i = 0; i < links.length; i++) {
    if (!seen[links[i]]) {
      uniqueLinks.push(links[i]);
      seen[links[i]] = true;
    }
  }

  // Create an HTML list of links
  const formattedLinks = uniqueLinks.map(function (link) {
    // Check if the link is a valid URL, tel link, or mailto link
    if (linkRegex.test(link)) {
      // Handle 'tel:', 'mailto:', and regular URLs differently for better display
      if (link.indexOf("tel:") === 0) {
        let phoneNumber = link.replace("tel:", ""); // Strip 'tel:' for display
        return (
          '<li><a href="' +
          link +
          '" target="_blank">' +
          "Call: " +
          formatPhoneNumber(phoneNumber) +
          "</a></li>"
        );
      } else if (link.indexOf("mailto:") === 0) {
        let email = link.replace("mailto:", ""); // Strip 'mailto:' for display
        return (
          '<li><a href="' + link + '" target="_blank">' + email + "</a></li>"
        );
      } else {
        return (
          '<li><a href="' + link + '" target="_blank">' + link + "</a></li>"
        );
      }
    }
    return "";
  });

  // Wrap the list items in an unordered list
  return '<ul class="ul-domains">' + formattedLinks.join("") + "</ul>";
};

function formatCurrentTime() {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return (
    (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes
  );
}

// Helper function to format phone numbers nicely (e.g., 212-506-4321)
const formatPhoneNumber = (phoneNumber) => {
  const cleaned = ("" + phoneNumber).replace(/\D/g, ""); // Remove non-numeric characters
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/); // Match 3-3-4 digit pattern
  if (match) {
    return match[1] + "-" + match[2] + "-" + match[3]; // Format as XXX-XXX-XXXX
  }
  return phoneNumber; // Return the original if it doesn't match the format
};
