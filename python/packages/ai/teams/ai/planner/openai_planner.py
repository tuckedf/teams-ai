"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
from typing import Union
from botbuilder.core import TurnContext
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAITextCompletion, OpenAIChatCompletion
from semantic_kernel.connectors.ai.text_completion_client_base import TextCompletionClientBase


from ai.turn_state import TurnState
from teams.ai.planner.ai_history_options import AIHistoryOptions
from teams.ai.planner.command_type import CommandType
from teams.ai.planner.plan import Plan
from teams.ai.prompts.prompt_template import PromptTemplate
from .planner import Planner
from .openai_planner_options import OpenAIPlannerOptions
from ai.prompts import DefaultPromptManager

from datetime import datetime
import json

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
        self._sk = Kernel()
        self._add_text_completion_service()
        self._add_chat_completion_service()

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
        result = await self._complete_prompt(turn_context, state, {}, history_options)

        if len(result) > 0:
            # Patch the occasional "Then DO" which gets predicted
            result = result.strip().replace("Then DO ", "THEN DO ").replace("Then SAY ", "THEN SAY")
            if result.startswith("THEN "):
                result = result[5:]

            assistant_prefix = history_options.assistant_prefix if history_options is not None else None
            
            if assistant_prefix:
                # The model sometimes predicts additional text for the human side of things so skip that.
                position = result.lower().index(assistant_prefix.lower())
                if position >= 0:
                    result = result[position + len(assistant_prefix):]

            # TODO: add response parser, assumes the result is a json object first
            plan: Plan = json.loads(result)
            
            # Filter to only a single SAY command
            if self._options.one_say_per_turn:
                spoken: bool = False
                new_commands = []
                for command in plan.commands:
                    if command.command_type == CommandType.SAY:
                        if spoken:
                            continue
                        else:
                            new_commands.append(command)
                            spoken = True
                    else:
                        new_commands.append(command)
                plan.commands = new_commands

        return Plan()
    
    def _add_text_completion_service(self) -> None:
        self._sk.add_text_completion_service("openai_text_completion", OpenAITextCompletion(self._options.default_model, 
        self._options.api_key, self._options.organization))

    def _add_chat_completion_service(self) -> None:
        self._sk.add_chat_completion_service("openai_chat_completion", OpenAIChatCompletion(self._options.default_model, self._options.api_key, self._options.organization))

    async def _complete_prompt(
            self,
            turn_context: TurnContext,
            state: TurnState,
            prompt_template: PromptTemplate,
            history_options: AIHistoryOptions = None
    ) -> str:
        model: str = self._get_model(prompt_template)
        is_chat_completion: bool = model.lower().startswith("gpt-")
        start_time = datetime.now()
        log_prefix = "CHAT" if is_chat_completion else "PROMPT"

        self._log_request(f"\n{log_prefix} REQUEST: \n'''\n{prompt_template.Text}\n'''")

        result: str

        if is_chat_completion:
            # TODO: implement te
            raise NotImplementedError("Chat completion is not yet implemented")
        else:
            result = await self._create_text_completion(state, history_options, prompt_template)
            pass

        duration = datetime.now() - start_time
        # TODO: investigate how to get prompt/completion tokens
        self._log_request(f"\n{log_prefix} SUCCEEDED: duration={duration} response={result}")

        return result

    async def _create_text_completion(self, state: TurnState, history_options: AIHistoryOptions, prompt_template: PromptTemplate):
        chat_request_config = {}

        text_completion_client = self._sk.get_ai_service(TextCompletionClientBase)(self)
        result = await text_completion_client.complete_async(prompt_template.Text, chat_request_config)
        return result

    def _get_model(self, prompt_template: PromptTemplate) -> str:
        if len(prompt_template.config.default_backends) > 0:
            return prompt_template.config.default_backends[0]
        else:
            return self._options.default_model
        
    def _log_request(self, request: str) -> None:
        if self._options.log_requests:
            print(request)