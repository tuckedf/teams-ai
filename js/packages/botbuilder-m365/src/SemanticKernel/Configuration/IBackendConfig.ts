/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IAzureOpenAIConfig, IOpenAIConfig } from "../AI";

export interface IBackendConfig {
    backendType: BackendTypes;
    azureOpenAI?: IAzureOpenAIConfig;
    openAI?: IOpenAIConfig;
}

export enum BackendTypes {
    Unknown = -1,
    AzureOpenAI = 0,
    OpenAI = 1,
}