"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Optional

class OpenAIPlannerOptions:

    api_key: str
    default_model: str
    prompt_folder: str
    organization: Optional[str]
    endpoint: Optional[str]
    one_say_per_turn: Optional[bool]
    use_system_message: Optional[bool]
    log_requests: Optional[bool]


    def __init__(self, api_key: str, default_model: str, *, one_say_per_turn = False, use_system_message = False, log_requests = False) -> None:
        self.api_key = api_key
        self.default_model = default_model
        self.one_say_per_turn = one_say_per_turn
        self.use_system_message = use_system_message
        self.log_requests = log_requests