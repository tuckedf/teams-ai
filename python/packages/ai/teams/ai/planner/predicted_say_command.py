"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from teams.ai.planner.command_type import CommandType
from teams.ai.planner.predicted_command import PredictedCommand

class PredictedSayCommand(PredictedCommand):
    type: CommandType.SAY
    response: str