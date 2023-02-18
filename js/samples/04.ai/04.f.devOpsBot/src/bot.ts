// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Application, DefaultTurnState, OpenAIPredictionEngine, AI } from 'botbuilder-m365';
import { MemoryStorage } from 'botbuilder';
import * as path from 'path';
import * as responses from './responses';

// Create prediction engine
const predictionEngine = new OpenAIPredictionEngine({
    configuration: {
        apiKey: process.env.OPENAI_API_KEY
    },
    prompt: path.join(__dirname, '../src/prompts/prompt.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.0,
        max_tokens: 1024,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Human:', ' AI:']
    },
    topicFilter: path.join(__dirname, '../src/prompts/topicFilter.txt'),
    topicFilterConfig: {
        model: 'text-davinci-003',
        temperature: 0.0,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.0,
        stop: [' Human:', ' AI:']
    },
    logRequests: true
});

// Strongly type the applications turn state
interface ConversationState {
    greeted: boolean;
    listNames: string[];
    lists: Record<string, string[]>;
}
type ApplicationTurnState = DefaultTurnState<ConversationState>;

// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    predictionEngine
});

// Export bots run() function
export const run = (context) => app.run(context);


// Define an interface to strongly type data parameters for actions
interface EntityData {
    list: string; // <- populated by GPT
    item: string; // <- populated by GPT
    items?: string[]; // <- populated by the summarizeList action
    lists?: Record<string, string[]>;
}

// Listen for new members to join the conversation
app.conversationUpdate('membersAdded', async (context, state) => {
    if (!state.conversation.value.greeted) {
        state.conversation.value.greeted = true;
        await context.sendActivity(responses.greeting());
    }
});

// List for /reset command and then delete the conversation state
app.message('/reset', async (context, state) => {
    state.conversation.delete();
    await context.sendActivity(responses.reset());
});

// Register action handlers
app.ai.action('addItem', async (context, state, data: EntityData) => {
    const items = getItems(state, data.list);
    items.push(data.item);
    setItems(state, data.list, items);
    return true;
});

app.ai.action('removeItem', async (context, state, data: EntityData) => {
    const items = getItems(state, data.list);
    const index = items.indexOf(data.item);
    if (index >= 0) {
        items.splice(index, 1);
        setItems(state, data.list, items);
        return true;
    } else {
        await context.sendActivity(responses.itemNotFound(data.list, data.item));

        // End the current chain
        return false;
    }
});

app.ai.action('findItem', async (context, state, data: EntityData) => {
    const items = getItems(state, data.list);
    const index = items.indexOf(data.item);
    if (index >= 0) {
        await context.sendActivity(responses.itemFound(data.list, data.item));
    } else {
        await context.sendActivity(responses.itemNotFound(data.list, data.item));
    }

    // End the current chain
    return false;
});

app.ai.action('summarizeLists', async (context, state, data: EntityData) => {
    data.lists = state.conversation.value.lists;
    if (data.lists) {
        // Chain into a new summarization prompt
        await app.ai.chain(
            context,
            state,
            {
                prompt: path.join(__dirname, '../src/summarizeAllLists.txt'),
                promptConfig: {
                    model: 'text-davinci-003',
                    temperature: 0.0,
                    max_tokens: 2048,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                }
            },
            data
        );
    } else {
        await context.sendActivity(responses.noListsFound());
    }

    // End the current chain
    return false;
});

// Register a handler to handle unknown actions that might be predicted
app.ai.action(AI.UnknownActionName, async (context, state, data, action) => {
    await context.sendActivity(responses.unknownAction(action));
    return false;
});

// Register a handler to deal with a user asking something off topic
app.ai.action(AI.OffTopicActionName, async (context, state) => {
    await context.sendActivity(responses.offTopic());
    return false;
});

function getItems(state: ApplicationTurnState, list: string): string[] {
    ensureListExists(state, list);
    return state.conversation.value.lists[list];
}

function setItems(state: ApplicationTurnState, list: string, items: string[]): void {
    ensureListExists(state, list);
    state.conversation.value.lists[list] = items ?? [];
}

function ensureListExists(state: ApplicationTurnState, listName: string): void {
    if (typeof state.conversation.value.lists != 'object') {
        state.conversation.value.lists = {};
        state.conversation.value.listNames = [];
    }

    if (!state.conversation.value.lists.hasOwnProperty(listName)) {
        state.conversation.value.lists[listName] = [];
        state.conversation.value.listNames.push(listName);
    }
}

