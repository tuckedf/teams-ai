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
            let date = _getDateString(reminder.date)

            card.body.push(
                reminderListCardItem(reminder, i % 2 == 0)
            )
        });
    }

    return card;
}

function _getDateString(date: Moment) : string {
    return moment(date).format("HH:mm Do MMM YYYY");
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

const DELETE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACT0lEQVR4Xu1bMU4DMRAMCImKIiWPoEtBSYt4QMQT7ifQU5z4AD0/QISGKs/gD5CENYojy/jic3Zn40v2pEinnD07Ozu+dU6X0QhwzOfz8+l0+kLQq10+NPeTMK4A1HQgx+Px1y6Jh3MIY0UiXOowFoxC1Wu5yfv5hPUqSC0JdQIIsCDM0zWuWwLcGNz5W1M8AwgQQ5Ym4ERTO3yl1ALWFsgEAFek1P5gOv/huwjeJ25eT/TdRXCD61rrtSVdzOdZqo1VgrPVVSl1vmmGRnfQsvtWB3Ql+hP0cTfGg3S1qGKbaWUvEcdtbPye3p3XdsS/N4r4lbbBg6t0HwEOLunQIn0EKLLU0AabAEOrmDRfc4C0okPDQ+z4ltHGKXZZeN3pFXcZ39fd9+4c6lIoeCK5VMIp03hR4C0YLQD36Q53fnZFogXgVpA7f+8CZAnsewDaAfvOLxvfBMhKdOADanfA4LuAhn9YItXuALiAJgBYYpY9wdz+4NEOgO/kuCKhBeDyg883AeASVx7AHFB5geD0zAFwiXUDFO87zAG6BaovmjmgvproMjIH6OpdXzRzQH010WVkDgDoLfkQRBIrmerROwDxfkCuatzroqY9egeYAKJ+GiCYOWCARYsphw9B7IFIaUGzS2AymXyEoE3TPJQGQY0nLo+EvWmrxHUmHqtt2zsCde/2+ff33Hnqs9P/hAPcvvPj2BtexPVWXAAHSMq+RSL0Jas1bkkc3yHJe9B1gPDfI1rJ5eIs4Ml7EchiN+t11mXDHFnJ6y7xGXG65lT+F+EpQmt27ym9AAAAAElFTkSuQmCC"