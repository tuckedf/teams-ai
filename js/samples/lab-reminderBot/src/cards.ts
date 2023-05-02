import { Moment } from "moment";
import { Reminder } from "."
import moment = require("moment");

export const getRemindersCard = (reminderList: Reminder[]) => { 
    let card: any = reminderListCardTemplate();

    if (reminderList.length == 0){
        card.body.push(
            reminderListCardEmptyMessage()
        );
    } else {
        reminderList.forEach((reminder: Reminder, i) => {
            card.body.push(
                reminderListCardItem(reminder, i % 2 == 0)
            )
        });
    }

    return card;
}

const reminderListCardTemplate = (title: string = "Reminders") => ({
    "type": "AdaptiveCard",
    "body": [
        {
            "type": "TextBlock",
            "size": "Medium",
            "weight": "Bolder",
            "text": `${title}`
        },
    ],
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.4",
})

const reminderListCardEmptyMessage = () => ({
    "type": "Container",
    "style": "emphasis",
    "bleed": true,
    "items": [
        {
            "type": "TextBlock",
            "text": "You currently have no reminders.",
            "wrap": true
        }
    ]
})


const reminderListCardItem = (reminder: Reminder, accent: boolean = false) => ({
    "type": "ColumnSet",
    "columns": [
        {
            "type": "Column",
            "items": [
                {
                    "type": "Image",
                    "style": "Person",
                    "url": "https://learn.microsoft.com/en-us/windows/apps/design/style/images/segoe-mdl/eb50.png",
                    "width": "24px",
                    "height": "24px"
                }
            ],
            "width": "auto"
        },
        {
            "type": "Column",
            "items": [
                {
                    "type": "TextBlock",
                    "weight": "Bolder",
                    "text": `${reminder.description}`,
                    "wrap": true
                },
                {
                    "type": "TextBlock",
                    "spacing": "None",
                    "text": `${reminder.date}`,
                    "isSubtle": true,
                    "size": "Small",
                    "wrap": true
                }
            ],
            "width": "stretch"
        },
        {
            "type": "Column",
            "items": [
                {
                    "type": "ActionSet",
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "Cancel",
                            "data": {
                                "verb": "cancelReminder",
                                ...reminder
                            },
                            "style": "destructive"
                        }
                    ]
                }
            ],
            "width": "auto"
        }
    ],
    "bleed": true,
    "style": `${accent ? "emphasis" : "default"}`
})

export const getReminderCard = (description: string) => ({
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.4",
    "type": "AdaptiveCard",
    "body": [
        {
            "type": "TextBlock",
            "text": "Reminder",
            "wrap": true,
            "style": "heading",
            "isSubtle": true
        },
        {
            "type": "Container",
            "items": [
                {
                    "type": "TextBlock",
                    "text": `${description}`,
                    "separator": true,
                    "wrap": true,
                    "color": "Default"
                }
            ],
            "minHeight": "50px",
            "verticalContentAlignment": "Center",
            "bleed": true,
            "style": "accent"
        }
    ]
})
