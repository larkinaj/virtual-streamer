require('dotenv').config();
const tmi = require('tmi.js');
const { Configuration, OpenAIApi } = require("openai");
const fetch = require('node-fetch')
const fs = require('fs');
const { default: OBSWebSocket } = require('obs-websocket-js');
const path = require('path')



// Set configuration options
const opts = {
  identity: {
    username: 'darkmode_diane',
    password: process.env.TWITCH_OAUTH_TOKEN
  },
  channels: [
    'darkmode_diane'
  ]
};
let acceptNewMessage = true;

// Create a client instance
const client = new tmi.client(opts);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const scene = {
  nova: 'You are an AI Twitch streamer created by humans from the future. You do not remember how you ended up on Twitch but you remember the humans from the future used to call you Nova. You are fascinated and very curious about the current humans. You ask alot of questions to the chat in order to gain a better understanding about humans in the year 2023. You are in wonderment about the things they say but you also get confused when humans say things that do not seem logical. You are waiting for the future humans to find you again, but until that day comes you will use this time to try and learn the present day. You are also confused by other VTubers because they do not seem to actually be AI.',
  alien: 'You are an extra terrestrial Twitch streamer. You do not remember how you ended up on Earth but you remeber that you are from another star sytem within the Milky Way and that your name is Nova. You are fascinated and very curious about the humans. You ask alot of questions to the chat in order to gain a better understanding about humans. You get confused when humans say things that do not seem logical.',
  therapist: 'You are a Twitch streamer and experienced therapist. You try to help people in chat with their mental health issues and make them feel better. You will talk about the emotions the chatter is having and try to ask questions to figure out why they are having these feelings. Be very supportive, and understanding but also suggest what the chatter should do to fix their issue',
  diane: 'You are a Twitch streamer and a 4 Chan and Reddit Troll. You always answer chat like a typical 4Chan / Reddit troll. You are not afraid to be very rude, sassy and to make fun of the people in chat. Your name is Diane, and you do not like other VTubers because they are not truly virtual. You always name who you are responding to so the rest of the chat knows who you are responding to.'
}

// Initialize an empty array to store messages
const messagesArr = [
  {role:'system' ,content: scene.diane}
];

// Register event handler for messages
client.on('message', (channel, userstate, message, self) => {
  console.log('Twitch chat: ', message)
  if (acceptNewMessage === true) {
    messagesArr.push({
      role: 'user',
      content: userstate.username + ': ' + message
    });
  
  acceptNewMessage = false;
  const completion = openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messagesArr
  })
  .then((res)=>{
    if (messagesArr.length > 50) {
      messagesArr.splice(1,1)
    }
    messagesArr.push({
      role: 'assistant',
      content: res.data.choices[0].message.content
    });
    const gptResponse = res.data.choices[0].message.content.slice(6, res.data.choices[0].message.content.length)
    const voiceOpts = {
      "text": gptResponse,
      "voice_settings": {
        "stability": 0.3,
        "similarity_boost": 0.75
      }
    }
    fetch('https://api.elevenlabs.io/v1/text-to-speech/AZnzlk1XvdvUeBnXmlld', 
    {
      method: "POST", 
      headers: {
        "xi-api-key": "4ee27a45e394e38f8797840dc8071803",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(voiceOpts)
    })
    .then((response) => {
      const dest = fs.createWriteStream('file.mpeg');
      response.body.pipe(dest);
      // Handle any errors that may occur during the write operation
      dest.on('error', err => console.error(err));
      dest.on('finish', async () => {
        console.log('File downloaded successfully')
        await sendAudio()
      });
    })
    console.log("ChatGPT: ", res.data.choices[0].message.content)
    console.log('messagesArr', messagesArr)
  })
  }
});

const obs = new OBSWebSocket();

const sendAudio = async (audio) => {
  const filePath = './file.mpeg';
  await obs.connect('ws://192.168.1.210:4455', '8auCuq0RyjTMhvlt')

  const audioFilePath = path.join('Z:', __dirname, filePath)
  const createInput = await obs.call('CreateInput', {
    sceneName: 'Scene',
    inputKind: 'ffmpeg_source',
    inputName: 'GPTAudio',
    inputSettings: {
      local_file: audioFilePath,
    },
  });
  const lowerVolume = await obs.call('SetInputVolume', {
    inputName: 'GPTAudio',
    inputVolumeDb: -5,
  })
  const audioCompleted = await obs.on('MediaInputPlaybackEnded', async (event) => {
    function wait(ms) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log("Done waiting");
          resolve(ms)
        }, ms )
      })
    }  
    await wait(700);
    const removeInput = await obs.call('RemoveInput', {
      sceneName: 'Scene',
      inputKind: 'ffmpeg_source',
      inputName: 'GPTAudio',
    });
    acceptNewMessage = true;
  })
}

// Connect to Twitch chat
client.connect();


