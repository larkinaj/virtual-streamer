require('dotenv').config();
const tmi = require('tmi.js');
const { Configuration, OpenAIApi } = require("openai");

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

// Initialize an empty array to store messages
const messages = [];

// Register event handler for messages
client.on('message', (channel, userstate, message, self) => {
  console.log('Twitch chat: ', message)
  messages.push({
    user: userstate.username,
    message: message
  });
  const completion = openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role:'user' ,content: message}]
  })
  .then((res)=>{
    client.say("lark_in", res.data.choices[0].message.content)
    console.log("ChatGPT: ", res.data.choices[0].message.content)
  })
});

// Connect to Twitch chat
client.connect();


