class RecorderService {
  constructor() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    this.em = document.createDocumentFragment();

    this.state = "inactive";

    this.chunks = [];
    this.chunkType = "";

    this.encoderMimeType = "audio/wav";

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
      this.encoderWorker = new Worker("js/encoder-wav-worker.js");
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
    this.sendQuery(blob)
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
  async sendQuery(blob) {
    console.log("sendQuery", blob);
    const formData = new FormData();
    formData.append("audio", blob, "recording.wav"); // Adjust the key as per your API requirement

    const response = await fetch("/query/audio/66f92044f9dd8878481c2dfe", {
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

      // Create a new audio element
      const audio = new Audio(URL.createObjectURL(audioBlob));

      // Set audio controls to allow user to play/pause
      audio.controls = true;

      // Append the audio element to a designated area in your UI
      const audioContainer = document.getElementById("recordings-cont"); // Ensure this element exists in your HTML
      audioContainer.appendChild(audio); // Append the new audio element

      // Optionally, auto-play the audio
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
