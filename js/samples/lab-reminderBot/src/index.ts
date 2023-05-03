/* eslint-disable security/detect-object-injection */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';
import { randomUUID } from 'crypto';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    CardFactory,
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationBotFrameworkAuthenticationOptions,
    MemoryStorage,
    MessageFactory,
    TurnContext
} from 'botbuilder';

// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
    process.env as ConfigurationBotFrameworkAuthenticationOptions
);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Create storage to use
//const storage = new MemoryStorage();

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error.toString()}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error.toString()}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo test your bot in Teams, sideload the app manifest.json within Teams Apps.');
});

import {
    Application,
    DefaultTurnState,
    AI,
    DefaultConversationState,
    DefaultUserState,
    DefaultTempState,
    DefaultPromptManager,
    AzureOpenAIPlanner
} from '@microsoft/botbuilder-m365';
import * as responses from './responses';
import * as moment from 'moment';
import { Moment } from 'moment';
import { CronJob } from 'cron';
import { getReminderCard, getRemindersCard } from './cards';

export interface Reminder {
    description: string
    date: Moment
    id: string;
}

const CRON_JOBS: Record<string, CronJob> = {}
const REMINDERS: Record<string, Reminder> = {};

// Strongly type the applications turn state
interface ConversationState extends DefaultConversationState {
    greeted: boolean;
}

type UserState = DefaultUserState;

type ApplicationTurnState = DefaultTurnState<ConversationState, UserState, DefaultTempState>;

if (!process.env.AzureOpenAIKey) {
    throw new Error('Missing AzureOpenAIKey environment variable');
}

if (!process.env.AzureOpenAIEndpoint) {
    throw new Error('Missing AzureOpenAIEndpoint environment variable');
}

const planner = new AzureOpenAIPlanner<ApplicationTurnState>({
    apiKey: process.env.AzureOpenAIKey!,
    endpoint: process.env.AzureOpenAIEndpoint!,
    defaultModel: 'gpt-35-turbo', // <-- AzureOpenAI deployment name
    logRequests: true 
})

// # Use the OpenAI endpoint
// const planner = new OpenAIPlanner<ApplicationTurnState>({
//     apiKey: process.env.OpenAIKey!,
//     defaultModel: 'gpt-3.5-turbo',
//     logRequests: true 
// })

const promptManager = new DefaultPromptManager<ApplicationTurnState>(path.join(__dirname, '../src/prompts'));

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner,
        promptManager,
        prompt: 'chatGPT',
        history: {
            trackHistory: false
        }
    }
});

// Define an interface to strongly type data parameters for actions
interface CreateReminderEntityData {
    description: string; // <- populated by GPT
    date: string; // <- populated by GPT
}

interface CancelReminderEntityData {
    index: string; // <- populated by GPT
}

// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', async (context: TurnContext, state: ApplicationTurnState) => {
    if (!state.conversation.value.greeted) {
        state.conversation.value.greeted = true;
        await context.sendActivity(responses.greeting());
    }
});

// List for /reset command and then delete the reminders list
app.message('/reset', async (context: TurnContext, state: ApplicationTurnState) => {
    cancelAllReminders();
    await context.sendActivity(responses.reset());
});

app.adaptiveCards.actionSubmit("cancelReminder", async (context: TurnContext, state: ApplicationTurnState, data: any) => {
    const id = data.id;
    
    if (!id) throw new Error("Reminder id not found in action execute data object.");
    
    if (REMINDERS[id]) {
        cancelReminder(id);
        await context.sendActivity(`Successfully deleted reminder: ${data.description}`)
    } else {
        await context.sendActivity(`Reminder does not exist. Updating reminder list`)
    }

    let card = getRemindersCard(getReminderList())
    const message = MessageFactory.attachment(CardFactory.adaptiveCard(card))
    message.id = context.activity.replyToId;
    
    context.updateActivity(message);
})

// Register action handlers
app.ai.action('CreateReminder', async (context: TurnContext, state: ApplicationTurnState, data: CreateReminderEntityData) => {
    let dateObj = getDate(data.date)

    if (!dateObj) {
        await context.sendActivity(responses.cannotParseDate());
        return false;
    }
    
    // date is in the past
    if (dateObj.isBefore(moment())) {
        await context.sendActivity(responses.dateIsInThePast());
        return false;
    }

    let id = randomUUID();

    addReminder(context, state, { description: data.description, date: dateObj, id: id });
    return true;
});

app.ai.action('CancelReminder', async (context: TurnContext, state: ApplicationTurnState, data: CancelReminderEntityData) => {
    return true;
});

app.ai.action('ViewReminders', async (context: TurnContext, state: ApplicationTurnState, data: undefined) => {
    let card = getRemindersCard(getReminderList())

    const message = MessageFactory.attachment(CardFactory.adaptiveCard(card))
    await context.sendActivity(message);
    
    return false;
})

app.ai.prompts.addFunction('getCurrentTime', async (context: TurnContext, state: ApplicationTurnState) => {
    return moment().format("YYYY-MM-DDTHH:mm:ss").toString();
})

// Register a handler to handle unknown actions that might be predicted
app.ai.action(
    AI.UnknownActionName,
    async (context: TurnContext, state: ApplicationTurnState, data: undefined, action?: string) => {
        await context.sendActivity(responses.unknownAction(action!));
        return false;
    }
);

// Listen for incoming server requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res as any, async (context) => {
        // Dispatch to application for routing
        await app.run(context);
    });
});

function addReminder(context: TurnContext, state: ApplicationTurnState, reminder: Reminder): void {
    REMINDERS[reminder.id] = reminder;

    let activity = Object.assign({}, context.activity);
    
    let job = new CronJob(
        reminder.date.toDate(), 
        async () => {
            let conversationReference = TurnContext.getConversationReference(activity);
                
            await adapter.continueConversationAsync(process.env.MicrosoftAppId!, conversationReference, async turnContext => {
                let card = getReminderCard(reminder.description);
                let message = MessageFactory.attachment(CardFactory.adaptiveCard(card))
                await turnContext.sendActivity(message);
            });

            cancelReminder(reminder.id);

        }, 
        null, 
        true
    );

    CRON_JOBS[reminder.id] = job
}

function cancelReminder(id: string): void {   
    delete REMINDERS[id]

    CRON_JOBS[id].stop();
    delete CRON_JOBS[id]
}

function cancelAllReminders(){
    getReminderList().forEach(reminder => cancelReminder(reminder.id))
}

function getDate(date: string) : Moment | undefined {
    let dateObj = moment(date, "YYYY-MM-DDTHH:mm:ss", true);

    if (!dateObj.isValid()) return;

    return dateObj;
}

function getReminderList() : Reminder[] {
    return Object.values(REMINDERS);
}
