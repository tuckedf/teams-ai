/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ILogger, NullLogger } from '../../Logger';
import { SKContext, ContextVariables } from '../../Orchestration';

export enum BlockTypes {
    Undefined = 0,
    Text = 1,
    Code = 2,
    Variable = 3,
}

export abstract class Block {
    private readonly _log: ILogger;

    /**
     * Base constructor
     * @param log App logger
     */
    constructor(log?: ILogger) {
        this._log = log ?? new NullLogger();
    }

    public get type(): BlockTypes {
        return BlockTypes.Undefined;
    }

    public content: string = '';

    /**
     * App Logger
     */
    protected get log(): ILogger {
        return this._log;
    }

    public renderCode(executionContext: SKContext): Promise<string> {
        throw new Error(`This block doesn't support code execution`);
    }

    public abstract isValid(): { valid: boolean; error: string; };

    public abstract render(variables?: ContextVariables): string;
}