## Overview

The lab module introduces users to a brand new Teams AI Library. Participants will have the opportunity to run the provided sample code and witness the seamless integration of LLM AI within a Teams Bot. By leveraging LLM AI, the bot will be able to engage in natural and intelligent conversations, making it an ideal tool for enhancing user experiences in various scenarios. This lab module aims to provide developers with hands-on experience in building AI-powered Teams Bots.

## Exercise 1: Setting up the Project

In this exercise you will be setting up the sample bot.

1. Log In to the machine with the password found in the `Resources` tab.

![Image](./assets/Setup03.png)

![Image](./assets/Setup04.png)

2. Load `Visual Studio Code` from the Desktop by double clicking this icon.

![Image](./assets/Setup01.png)

3. The project `TravelBot` should already be configured. You can verify by confirming the folder is open in the side panel.

![Image](./assets/Setup02.png)

4. Navigate to the `env/.env.local.user` file. It should look like this:

![Image](./assets/Setup05.png)

Now go to the `Resources` tab and grab the `Key` and `Endpoint` from the `Azure Portal` section. Set the value in the following way:

```
SECRET_OPENAI_API_KEY=Key
SECRET_OPENAI_ENDPOINT=Endpoint
```

So if the `Key` was `9bc5c422-0e6f-40d3-9fb7-880f99d2f390`. And `Endpoint` was `https://lab132.openai.azure.com`. The file should look like this:

```
SECRET_BOT_PASSWORD=
SECRET_OPENAI_API_KEY=9bc5c422-0e6f-40d3-9fb7-880f99d2f390
SECRET_OPENAI_ENDPOINT=https://lab132.openai.azure.com/
```

No need to set `SECRET_BOT_PASSWORD` variable.

## Exercise 2: Starting the bot

At this point the project and environment variables should be properly configured. We will go ahead and start the bot and sideload it into Teams using the Teams Toolkit extension in VS Code. Here are the steps to do that:

With the project open in Visual Studio and Exercise 1 completed, proceed to press `F5` on the keyboard. This will kick start the Teams Toolkit process of provisioning the required Azure resources, Starting the local bot web server, configuring the local tunnel, and sideloading the bot into Teams.

1. First, you will be required by Teams toolkit to sign in with a Microsoft account. The following popup will show:

![Image](./assets/Setup06.png)

2. Click "Sign In" and a web browser should open with the Microsoft login page:

![Image](./assets/Setup07.png)

3. Now use the credentials provided in the `Resources` tab. You should find the `username` and `password` under `User Credentials`. Fill those in and click "Next". If there are any "Action Required" prompts in the login flow simply click "Ask Later". Once you have successfully logged in you should see the following page:

![Image](./assets/Setup08.png)

You can close the tab.

4. Now the Team's toolkit will start the local tunnel, bot webserver and attempt to sideload the bot to Teams. In this step a web browswer will open up and you will be asked to provide Microsoft credentials again. Simply provide the same credentials from Step 3.

5. Once you login, you should see this:

![Image](./assets/TravelBot001.jpg)

Proceed to Add the bot in Teams.

6. Viola! You should be able to send a message to the bot:

![Image](./assets/Setup09.png)

## Exercise 3: Microsoft Teams Conversational Bot with the model - Travel Bot

This is a conversational bot for Microsoft Teams that thinks it's is an expert in the travel industry with over 20 years experience. It will ask user the destination they're planning to visit and give them a detailed description of their destination and suggest some things to see and do. 

The bot uses the `text-davinci-003` model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow the model to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

### Step 1: Interact with the Bot

![Image](./assets/TravelBot002.png)

In the above example you can see the Travel bot gave suggestions for things to do based on the activity preference provided.

Play around with the Travel bot. Here are some things you can ask it to do:

1. Ask for recommandations for places to visit.
    - "What are nice sightseeing spots for tourists in Seattle?"
    - "What are must do things in a Europe trip?"
    - "What are the famous art galleries in New York?"
2. Plan out a trip.
    - "Come up with a detailed plan for a two day trip to Los Angeles, California. I love trying new restaurants and shopping."

##### This bot can do more than help you travel...
Even though this is a travel bot, it will be able to answer more than just travel related questions. Try asking it one of the following questions:

1. "Tell me about the upcomming US Elections"
2. "When was Canada founded?"

This is because the Travel bot is simply a proxy between the user and OpenAI model `text-davinci-003`. Obviously this is not a good thing since the conversation is out of scope. We will see later on in this lab how to prevent this from happening. To do that we must first understand how this works.

### Step 2: How it Works

In simple terms, When a user sends a message to Travel bot. It is, within the bot web server, injected into a prompt template and passed into the `text-davinci-003` model. The response is then returned to the user in Teams. 

Open the `src/promps/chat/skprompt.txt` file to find descriptive prompt engineering that, in plain language and with minor training, instructs the model how the bot should conduct itself and facilitate conversation:

#### let's take a look the prompt

```
The following is a conversation with an AI assistant. 
The assistant is an expert in the travel industry with over 20 years experience.
The assistant should greet the user and ask them the destination they're planning to visit.
Upon learning the users destination, the assistant should give them a detailed description of their destination and suggest some things to see and do.
The assistant should ask the user what kind of activities they enjoy or places they like to see so they can better tailor their recommendations to the user.

{{$history}}
User: {{$input}}
Assistant: 
```

Note that `{{$history}}` populates the conversation history and `{{$input}}` populates the user's latest message into the prompt. These values are retrieved from the program in runtime.

It is important to pass in the conversation history to the model since its response will depend solely on the prompt passed into the model. Here's an example of how the model uses the historical context:

```
USER: Hello.
AI: Hi! Welcome to the travel assistant. Where are you planning to visit?
USER: Japan
AI: Great choice! Japan is a beautiful country with a rich culture and history. There are many things to see and do in Japan, from visiting ancient temples and shrines to exploring the bustling cities. What kind of activities do you enjoy?
USER: I like to eat Sushi.
AI: There are many famous Sushi restaurants all over Japan. Which cities are you planning to visit?
```

Notice that the model remembered the user's specified destination Japan when asking which cities the user is planning to visit in the 6th message.

##### View logs of your interaction with the travel bot

In the Visual Studio code terminal, you can see the rendered prompt that is passed to the model in every interaction. Notice how the history and user's input is injected in the bottom of the prompt.

![Image](./assets/TravelBot003.png)

#### let's take a look at the code

Notice that outside of the `\history` and `\clearhistory` message activity handler, the `index.ts` file relies on the model for all its natural language modelling - no code is specifically written to handle language processing. Rather, the AI Module is designed to handle this for you:

```typescript
type ApplicationTurnState = DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>;

const planner = new AzureOpenAIPlanner({
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: process.env.OPENAI_ENDPOINT,
    defaultModel: 'text-davinci-003',
    logRequests: true,
})

const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));

// Define storage and application
const storage = new MemoryStorage();

// Define the application instance
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner,
        promptManager,
        prompt: 'chat', // refers to the `src/prompts/chat` folder
        history: { // the AI module manages the conversation history
            assistantHistoryType: 'text',
            maxTurns: 10, 
            maxTokens: 1000
        }
    }
});
```

Notice that in the `ai` object, the `'chat'` prompt is specified. This is a folder in the `../src/prompts` folder as defined in the `promptManager`:

```javascript
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));
```

### Step 3: Extend the Prompt to work to prevent out of scope conversations

Instructions for extending the prompt to work with adaptive cards.

### Step 4: Extend the Prompt to work with Adaptive Cards

### Step 5: Rewrite the prompt to use actions (optional)

## Exercise 3: Next Steps

### Overview

Overview of the next steps.

### Take the Lab Home with You

Instructions for taking the lab home with you.
