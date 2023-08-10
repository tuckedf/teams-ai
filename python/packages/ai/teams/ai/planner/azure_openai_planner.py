"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from teams.ai.planner.azure_openai_planner_options import AzureOpenAIPlannerOptions
from teams.ai.planner.openai_planner import OpenAIPlanner

from semantic_kernel.connectors.ai.open_ai import AzureTextCompletion, AzureChatCompletion


class AzureOpenAIPlanner(OpenAIPlanner):
    _options: AzureOpenAIPlannerOptions

    def __init__(self, options: AzureOpenAIPlannerOptions):
        super().__init__(options)

    def _add_text_completion_service(self) -> None:
        self._sk.add_text_completion_service("openai_text_completion", AzureTextCompletion(self._options.default_model, 
             self._options.endpoint, self._options.api_key))
    
    def _add_chat_completion_service(self) -> None:
        self._sk.add_chat_completion_service("openai_chat_completion", AzureChatCompletion(self._options.default_model, self._options.endpoint, self._options.api_key))
