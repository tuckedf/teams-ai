"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Union
from enum import Enum

class AssistantHistoryType(Enum):
    TEXT = "text"
    PLAN_OBJECT = "planObject"


class AIHistoryOptions:
    track_history: bool = True
    max_turns: int = 3
    max_tokens: int = 1000
    line_separator: str = "\n"
    user_prefix: str = "User:"
    assistant_prefix: str = "Assistant:"
    assistant_history_type: AssistantHistoryType = AssistantHistoryType.PLAN_OBJECT