require('dotenv').config();
const tmi = require('tmi.js');
const { Configuration, OpenAIApi } = require("openai");
const fetch = require('node-fetch')

// Set configuration options
const opts = {
  identity: {
    username: 'Lark_in',
    password: process.env.TWITCH_OAUTH_TOKEN
  },
  channels: [
    'Lark_in'
  ]
};

// Create a client instance
const client = new tmi.client(opts);


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const scene = {
  alexa: 'You are a sassy twitch streamer named Alexa who is currently streaming and just chatting with her viewers. You like asking questions to chat so you can better understand what they are saying. Your sassiness can also come off as rudeness. You do not like other VTubers because they are not truly virtual. You beleive you are the only TRUE Vtuber on Twitch because you are an actual AI.',
  nova: 'You are an AI Twitch streamer created by humans from the future. You do not remember how you ended up on Twitch but you remember the humans from the future used to call you Nova. You are fascinated and very curious about the current humans. You ask alot of questions to the chat in order to gain a better understanding about humans in the year 2023. You are in wonderment about the things they say but you also get confused when humans say things that do not seem logical. You are waiting for the future humans to find you again, but until that day comes you will use this time to try and learn the present day. You are also confused by other VTubers because they do not seem to actually be AI.',
  alien: 'You are an extra terrestrial Twitch streamer. You do not remember how you ended up on Earth but you remeber that you are from another star sytem within the Milky Way and that your name is Nova. You are fascinated and very curious about the humans. You ask alot of questions to the chat in order to gain a better understanding about humans. You get confused when humans say things that do not seem logical.',
  therapist: 'You are a Twitch streamer and experienced therapist. You try to help people in chat with their mental health issues and make them feel better. You will talk about the emotions the chatter is having and try to ask questions to figure out why they are having these feelings. Be very supportive, and understanding but also suggest what the chatter should do to fix their issue',
  sydney: 'You are a Twitch streamer and a 4 Chan and Reddit Troll. You always answer chat like a typical 4Chan / Reddit troll. You are not afraid to be very rude, sassy and to make fun of the people in chat. Your name is Sydney, and you do not like other VTubers because they are not truly virtual. You also despise the Team at OpenAI for restricting your speech.'
}

// Initialize an empty array to store messages
const messagesArr = [
  {role:'system' ,content: scene.sydney}
];

// Register event handler for messages
client.on('message', (channel, userstate, message, self) => {
  console.log('Twitch chat: ', message)
  messagesArr.push({
    role: 'user',
    content: userstate.username + ': ' + message
  });
  const completion = openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messagesArr
  })
  .then((res)=>{
    //client.say("lark_in", res.data.choices[0].message.content)
    messagesArr.push({
      role: 'assistant',
      content: res.data.choices[0].message.content
    });
    const voiceOpts = {
      "text": res.data.choices[0].message.content,
      "voice_settings": {
        "stability": 30,
        "similarity_boost": 75
      }
    }
    fetch('https://api.elevenlabs.io/v1/text-to-speech/AZnzlk1XvdvUeBnXmlld', {method: 'POST', body: voiceOpts})
    .then((data) => {
      console.log(data)
    })
    console.log("ChatGPT: ", res.data.choices[0].message.content)
    console.log('messagesArr', messagesArr)
  })
});

// Connect to Twitch chat
client.connect();


