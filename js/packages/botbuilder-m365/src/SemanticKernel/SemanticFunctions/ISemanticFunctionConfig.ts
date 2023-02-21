/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPromptTemplate } from "./IPromptTemplate";
import { IPromptTemplateConfig } from "./PromptTemplateConfig";

export interface ISemanticFunctionConfig {
    promptTemplateConfig: IPromptTemplateConfig;
    promptTemplate: IPromptTemplate;
}
