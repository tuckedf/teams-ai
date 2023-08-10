"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from teams.ai.planner.openai_planner_options import OpenAIPlannerOptions


class AzureOpenAIPlannerOptions(OpenAIPlannerOptions):
    endpoint: str

    def __init__(self, api_key: str, default_model: str, endpoint: str, *, one_say_per_turn=False, use_system_message=False, log_requests=False) -> None:
        self.endpoint = endpoint
        super().__init__(api_key, default_model, one_say_per_turn=one_say_per_turn, use_system_message=use_system_message, log_requests=log_requests)