"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
import os
from typing import Callable

from botbuilder.core import TurnContext
from teams.ai.turn_state import TurnState
from teams.ai.prompts import PromptTemplate
import semantic_kernel as sk
from semantic_kernel.skill_definition import sk_function

SK_CONFIG_FILE_NAME = "config.json"
SK_PROMPT_FILE_NAME = "skprompt.txt"


class DefaultPromptManager:
    """
    Prompt manager used by action planner internally
    """

    _prompts_folder: str
    _templates: dict[str, PromptTemplate]
    _functions: dict[str, Callable[[TurnContext, TurnState], str]]

    def __init__(self, prompts_folder: str) -> None:
        """
        Initializes a new instance of the DefaultPromptManager class.

        :param prompts_folder: The base folder path where the prompt files are located.
        """
        self._prompts_folder = prompts_folder
        self._templates = {}
        self._functions = {}

    def add_function(
        self, name: str, handler: Callable[[TurnContext, TurnState], str], allow_overrides=False
    ):
        """
        Adds a new function to the prompt manager.

        :param name: The name of the function.
        :param handler: The function handler.
        :param allow_overrides: Whether to allow overriding an existing function with the same name.
        """
        if not allow_overrides and self._functions.get(name):
            raise Exception(f"Function {name} already exists")

        self._functions[name] = handler
        return self

    async def render_prompt(
        self, context: TurnContext, state: TurnState, name_or_template: str | PromptTemplate
    ) -> PromptTemplate:
        """
        Renders the given prompt template.

        :param context: The turn context for current turn of conversation.
        :param state: The current turn state.
        :param name_or_template: The name of the prompt template or the prompt template itself.
        """
        prompt_template: PromptTemplate
        kernel: sk.Kernel = sk.Kernel()
        if isinstance(name_or_template, str):
            prompt_folder: str = os.path.join(self._prompts_folder, name_or_template)
            prompt_config: sk.PromptTemplateConfig = sk.PromptTemplateConfig.from_json(
                self._read_file(os.path.join(prompt_folder, SK_CONFIG_FILE_NAME))
            )
            prompt_text: str = self._read_file(os.path.join(prompt_folder, SK_PROMPT_FILE_NAME))
            prompt_template: sk.PromptTemplate = sk.PromptTemplate(
                prompt_text, kernel.prompt_template_engine, prompt_config
            )
        else:
            prompt_template = name_or_template

        context = self._create_kernel_context(kernel, context, state)
        final_prompt = await prompt_template.render_async(context)


    def _read_file(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise Exception(f"Missing prompt config or text file: {file_path} does not exist")
        with open(file_path, "r") as file:
            return file.read()

    def _create_kernel_context(
        self, kernel: sk.Kernel, context: TurnContext, state: TurnState
    ) -> None:
        for function_name, function in self._functions.items():

            class Wrapper:
                @sk_function(name=function_name)
                def run(self):
                    return function(context, state)

            kernel.import_skill(Wrapper())

        return kernel.create_new_context()
