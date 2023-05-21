# Microsoft Teams Conversational Bot with GPT: Travel Bot

This is a conversational bot for Microsoft Teams that thinks it's is an expert in the travel industry with over 20 years experience. The bot uses the text-davinci-003 model to chat with Teams users and respond in a polite and respectful manner, staying within the scope of the conversation.

This sample illustrates basic conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf, using only a natural language prompt file to guide it.

It shows M365 botbuilder SDK capabilities like:

<details open>
    <summary><h3>Conversational bot scaffolding</h3></summary>
    Throughout the 'index.ts' file you'll see the scaffolding created to run a simple conversational bot, like storage, authentication, and conversation state.
</details>
<details open>
    <summary><h3>Natural language modelling</h3></summary>
    Notice that outside of the '\history' and '\clearhistory' command, the 'index.ts' file relies on GPT for all its natural language modelling - no code is specifically written to handle language processing. Rather, the AI Module is designed to handle this for you:

```javascript
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
        history: {
            assistantHistoryType: 'text',
            maxTurns: 10, 
            maxTokens: 1000
        }
    }
});
```

</details open>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
    Within the AI module, the `chat` prompt is specified. This is a folder in the `../src/prompts` folder as defined in the `promptManager`:

```javascript
const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));
```

Open the `chat/skprompt.txt` file to find descriptive prompt engineering that, in plain language and with minor training, instructs GPT how the bot should conduct itself and facilitate conversation:

#### skprompt.txt

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

Note that `{{$history}}` populates the conversation history and `{{$input}}` populates the user's latest message into the prompt. These are prompt template variables that reference the `state.temp.history` and `state.temp.input` properties, respectively. The `state` object is of type `ApplicationTurnState`.

</details>
<details open>
    <summary><h3>Conversational session history</h3></summary>
    Because this sample leaves the conversation to GPT, the bot simply facilitates user conversation as-is. But because it includes the 'skprompt.txt' prompt template to guide it, GPT will store and leverage session history appropriately. From the 'skprompt.txt' file:

```
{{$history}}
```

For example, let's say the user's name is "Dave". The bot might carry on the following conversation:

```
DAVE: Hi there, I'm Dave.
AI: Hi Dave! Welcome to the travel assistant. Where are you planning to visit?
DAVE: Japan
AI: Great choice! Japan is a beautiful country with a rich culture and history. There are many things to see and do in Japan, from visiting ancient temples and shrines to exploring the bustling cities. What kind of activities do you enjoy?
```

Notice that the bot remembered Dave's first message when responding to the second.

</details>
<details open>
    <summary><h3>Localization across languages</h3></summary>
    Because this sample leverages GPT for all its natural language modelling, the user can talk to an AI bot in any language of their choosing. The bot will understand and respond appropriately with no additional code required.
</details>