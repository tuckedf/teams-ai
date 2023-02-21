/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CaseInsensitiveSet } from "../Internals";
import { ILogger, NullLogger } from "../Logger";
import { SKContext } from "../Orchestration";
import { ParameterView } from "../Registry";
import { IPromptTemplateEngine } from "../TemplateEngine";
import { BlockTypes, VarBlock } from "../TemplateEngine/Blocks";
import { IPromptTemplate } from "./IPromptTemplate";
import { IPromptTemplateConfig } from "./PromptTemplateConfig";

export class PromptTemplate implements IPromptTemplate {
    private readonly _template: string;
    private readonly _templateEngine: IPromptTemplateEngine;
    private readonly _log: ILogger = new NullLogger();
    private readonly _promptConfig: IPromptTemplateConfig;

    constructor(template: string, promptTemplateConfig: IPromptTemplateConfig, kernel: IKernel) {
        this._template = template;
        this._promptConfig = promptTemplateConfig;
        this._templateEngine = kernel.PromptTemplateEngine;
    }

    public getParameters(): ParameterView[] {
        const seen = new CaseInsensitiveSet<string>();
        const result: ParameterView[] = [];

        // Parameters from config.json
        this._promptConfig.input?.parameters?.forEach(p => {
            if (p) {
                const view = new ParameterView(
                    p.name,
                    p.description,
                    p.defaultValue
                );
                result.push(view);
                seen.add(p.name);
            }
        });

        // Parameters from the template
        this._templateEngine
            .extractBlocks(this._template)
            .filter(x => x.type === BlockTypes.Variable)
            .map(x => x as VarBlock)
            .filter(x => !seen.has(x.name))
            .forEach(x => result.push(new ParameterView(x.name)));

        return result;
    }

    public async render(executionContext: SKContext): Promise<string> {
        return await this._templateEngine.render(this._template, executionContext);
    }
}