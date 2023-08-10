"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
from typing import Union
from botbuilder.core import TurnContext
from semantic_kernel import PromptTemplate, Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAITextCompletion, OpenAIChatCompletion

from ai.turn_state import TurnState
from .planner import Planner
from .openai_planner_options import OpenAIPlannerOptions
from ai.prompts import DefaultPromptManager

class OpenAIPlanner(Planner):
    """
    Planner that uses OpenAI's API to generate prompts
    """

    _options: OpenAIPlannerOptions
    _sk: Kernel
    _prompt_manager: DefaultPromptManager

    def __init__(self, options: OpenAIPlannerOptions) -> None:
        self._options = options
        self._prompt_manager = DefaultPromptManager(options.prompt_folder)
        self._sk = Kernel
        self._sk.add_text_completion_service("openai_text_completion", OpenAITextCompletion(options.default_model, 
                                                                                            options.api_key, options.organization))
        self._sk.add_chat_completion_service("openai_chat_completion", OpenAIChatCompletion(options.default_model, options.api_key, options.organization))

    async def generate_plan(
        self,
        turn_context: TurnContext,
        state: TurnState,
        prompt_name_or_template: Union[str, PromptTemplate],
        *,
        history_options: AIHistoryOptions,
    ) -> Plan:
        """
        Generates a plan based on the given turn state and prompt name or template.

        Args:
            turn_context (TurnContext): The turn context for current turn of conversation
            state (TurnState): The current turn state.
            prompt_name_or_template (Union[str, PromptTemplate]): The name of the prompt or a prompt template to use.
            history_options (AIHistoryOptions): The options for the AI history.

        Returns:
            Plan: The generated plan.
        """
        raise NotImplementedError()
    
    async def _complete_prompt(
            self,
            turn_context: TurnContext,
            state: TurnState,
            prompt_template: PromptTemplate,
            *,
            history_options: AIHistoryOptions
    ) -> str:
        