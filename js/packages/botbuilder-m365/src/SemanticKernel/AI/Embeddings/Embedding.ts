/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */


/**
 * Represents a strongly typed vector of numeric data.
 */
export class Embedding implements IEquatable {
    /**
     * An empty Embedding<TData> instance.
     */
    public static readonly Empty: Embedding = new Embedding([]);

    /**
     * Initializes a new instance of the Embedding<TData> class that contains numeric elements copied from the specified collection.
     * @param vector The source data.
     * @throws {ArgumentException} An unsupported type is used as TData.
     * @throws {ArgumentNullException} A null vector is passed in.
     */
    constructor(vector: IEnumerable<TData>) {
        if (!Embedding.isSupported) {
            throw new Error(`Embeddings do not support type '${typeof(TData).name}'. Supported types include: [ ${Embedding.SupportedTypes.map(t => t.name).join(', ')} ]`);
        }

        // Create a local, protected copy
        this._vector = [...vector];
    }

    /**
     * Gets the vector as a ReadOnlyCollection<T>.
     */
    public get vector(): IEnumerable<TData> {
        return this._vector;
    }

    /**
     * Gets a value that indicates whether TData is supported.
     */
    public static get isSupported(): boolean {
        return Embedding.SupportedTypes.includes(typeof(TData));
    }

    /**
     * true if the vector is empty.
     */
    public get isEmpty(): boolean {
        return this._vector.length === 0;
    }

    /**
     * The number of elements in the vector.
     */
    public get count(): number {
        return this._vector.length;
    }

    /**
     * Gets the vector as a read-only span.
     */
    public asReadOnlySpan(): Readonly<TData[]> {
        return this._vector;
    }

    /**
     * Serves as the default hash function.
     * @returns A hash code for the current object.
     */
    public getHashCode(): number {
        return this._vector.getHashCode();
    }

    /**
     * Determines whether two object instances are equal.
     * @param obj The object to compare with the current object.
     * @returns true if the specified object is equal to the current object; otherwise, false.
     */
    public equals(obj: any): boolean {
        return (obj instanceof Embedding<TData>) && this.equals(obj);
    }

    /**
     * Compares two embeddings for equality.
     * @param other The Embedding<TData> to compare with the current object.
     * @returns true if the specified object is equal to the current object; otherwise, false.
     */
    public equals(other: Embedding<TData>): boolean {
        return this._vector.equals(other._vector);
    }

    /**
     * Compares two embeddings for equality.
     * @param left The left Embedding<TData>.
     * @param right The right Embedding<TData>.
     * @returns true if the embeddings contain identical data; false otherwise
     */
    public static equals(left: Embedding<TData>, right: Embedding<TData>): boolean {
        return left.equals(right);
    }

    /**
     * Implicit creation of an Embedding<TData> object from an array of data.>
     * @param vector An array of data.
     */
    public static fromArray<TData>(vector: TData[]): Embedding<TData> {
        return new Embedding<TData>(vector);
    }

    /**
     * Implicit creation of an array of type TData from a Embedding<TData>.
     * @param embedding Source Embedding<TData>.
     * @remarks A clone of the underlying data.
     */
    public static toArray<TData>(embedding: Embedding<TData>): TData[] {
        return [...embedding._vector];
    }

    /**
     * Implicit creation of an ReadOnlySpan<T> from a Embedding<TData>.
     * @param embedding Source Embedding<TData>.
     * @remarks A clone of the underlying data.
     */
    public static toReadOnlySpan<TData>(embedding: Embedding<TData>): Readonly<TData[]> {
        return [...embedding._vector];
    }

    #region private ================================================================================

    private readonly _vector: TData[];

    #endregion
}