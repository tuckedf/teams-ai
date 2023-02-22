/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Embedding } from "./Embedding";


/**
 * Represents an object that has an {@link Embedding}.
 * @template TData The embedding data type.
 */
export interface IEmbeddingWithMetadata {
    /**
     * Gets the {@link Embedding}.
     */
    Embedding: Embedding;
}