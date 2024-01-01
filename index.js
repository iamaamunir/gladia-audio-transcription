const webSocket = require("ws")
require("dotenv").config()
const gladiaKey = process.env.GLADIA_API_KEY
const gladiaUrl = "wss://api.gladia.io/audio/text/audio-transcription"
const ws = new webSocket(gladiaUrl)
const SAMPLE_RATE = 16000
const mic = require("mic")

if (!gladiaKey) {
  console.error("You must provide a gladia key. Go to app.gladia.io")
  exit(1)
} else {
  console.log("using the gladia key : " + gladiaKey)
}

ws.on("open", () => {
  const configuration = {
    x_gladia_key: gladiaKey,
    language_behaviour: "automatic single language",
    sample_rate: SAMPLE_RATE,
    encoding: "WAV",
  }
  ws.send(JSON.stringify(configuration))
  const microphone = mic({
    rate: SAMPLE_RATE,
    channels: "1",
  })
  const microphoneInputStream = microphone.getAudioStream()
  microphoneInputStream.on("data", function (data) {
    const base64 = data.toString("base64")
    if (ws.readyState === webSocket.OPEN) {
      ws.send(JSON.stringify({ frames: base64 }))
    } else {
      console.log("WebSocket ready state is not [OPEN]")
    }
  })
  microphoneInputStream.on("error", function (err) {
    console.log("Error in Input Stream: " + err)
  })
  microphone.start()
})

ws.on("message", (event) => {
  const utterance = JSON.parse(event.toString())
  console.log(utterance)
  if (utterance.event === "connected") {
    console.log(`\n* Connection id: ${utterance.request_id} *\n`)
  }
  // print result
  else if (utterance.event === "transcript" && utterance.transcription) {
    console.log(
      `${utterance.type}: (${utterance.language}) ${utterance.transcription}`
    )
  } else if (utterance.event === "error") {
    console.error(`[${utterance.code}] ${utterance.message}`)
    socket.close()
  }
})

ws.on("error", (error) => {
  console.log("An error occurred:", error.message)
})

ws.on("close", () => {
  console.log("Connection closed")
})
