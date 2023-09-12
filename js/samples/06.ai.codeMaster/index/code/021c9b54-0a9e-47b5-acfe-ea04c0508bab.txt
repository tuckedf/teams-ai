import { SizeUnit, ValidationEvent, ValidationPhase } from "./enums";
import { GlobalSettings, SizeAndUnit } from "./shared";
import { Strings } from "./strings";
import {
  dateToString,
  getEnumValueByName,
  parseBool,
  parseNumber,
  parseString,
} from "./utils";

export interface IValidationEvent {
  source?: SerializableObject;
  phase: ValidationPhase;
  event: ValidationEvent;
  message: string;
}

export class Version {
  private _versionString!: string;
  private _major: number;
  private _minor: number;
  private _isValid = true;
  private _label?: string;

  constructor(major = 1, minor = 1, label?: string) {
    this._major = major;
    this._minor = minor;
    this._label = label;
  }

  static parse(
    versionString: string,
    context: BaseSerializationContext
  ): Version | undefined {
    if (!versionString) {
      return undefined;
    }

    const result = new Version();
    result._versionString = versionString;

    const regEx = /(\d+).(\d+)/gi;
    const matches = regEx.exec(versionString);

    if (matches != null && matches.length === 3) {
      result._major = parseInt(matches[1], 10);
      result._minor = parseInt(matches[2], 10);
    } else {
      result._isValid = false;
    }

    if (!result._isValid) {
      context.logParseEvent(
        undefined,
        ValidationEvent.InvalidPropertyValue,
        Strings.errors.invalidVersionString(result._versionString)
      );
    }

    return result;
  }

  toString(): string {
    return !this._isValid
      ? this._versionString
      : `${this._major}.${this._minor}`;
  }

  toJSON(): any {
    return this.toString();
  }

  compareTo(otherVersion: Version): number {
    if (!this.isValid || !otherVersion.isValid) {
      throw new Error("Cannot compare invalid version.");
    }

    if (this.major > otherVersion.major) {
      return 1;
    } else if (this.major < otherVersion.major) {
      return -1;
    } else if (this.minor > otherVersion.minor) {
      return 1;
    } else if (this.minor < otherVersion.minor) {
      return -1;
    }

    return 0;
  }

  get label(): string {
    return this._label ? this._label : this.toString();
  }

  get major(): number {
    return this._major;
  }

  get minor(): number {
    return this._minor;
  }

  get isValid(): boolean {
    return this._isValid;
  }
}

export type TargetVersion = Version | "*";

export class Versions {
  static readonly v1_0 = new Version(1, 0);
  static readonly v1_1 = new Version(1, 1);
  static readonly v1_2 = new Version(1, 2);
  static readonly v1_3 = new Version(1, 3);
  static readonly v1_4 = new Version(1, 4);
  static readonly v1_5 = new Version(1, 5);
  // If preview tag is added/removed from any version,
  // don't forget to update .ac-schema-version-1-?::after too in adaptivecards-site\themes\adaptivecards\source\css\style.css
  static readonly v1_6 = new Version(1, 6, "1.6 Preview");
  static readonly latest = Versions.v1_5;

  static getAllDeclaredVersions(): Version[] {
    const properties: Version[] = [];

    for (const propertyName in Version) {
      if (propertyName.match(/^v[0-9_]*$/)) {
        // filter latest
        try {
          const propertyValue = (Version as any)[propertyName];

          if (propertyValue instanceof Version) {
            properties.push(propertyValue);
          }
        } catch {
          // If a property happens to have a getter function and
          // it throws an exception, we need to catch it here
        }
      }
    }
    return properties.sort((v1: Version, v2: Version) => v1.compareTo(v2));
  }
}

export function isVersionLessOrEqual(
  version: TargetVersion,
  targetVersion: TargetVersion
): boolean {
  if (version instanceof Version) {
    if (targetVersion instanceof Version) {
      return targetVersion.compareTo(version) >= 0;
    } else {
      // Target version is *
      return true;
    }
  } else {
    // Version is *
    return true;
  }
}

export abstract class BaseSerializationContext {
  private _validationEvents: IValidationEvent[] = [];

  onAfterObjectParsed?: (
    parsedObject: SerializableObject,
    source: PropertyBag
  ) => void;

  toJSONOriginalParam: any;
  targetVersion: Version;
  hostContext?: any;

  constructor(targetVersion: Version = Versions.latest) {
    this.targetVersion = targetVersion;
  }

  serializeValue(
    target: { [key: string]: any },
    propertyName: string,
    propertyValue: any,
    defaultValue: any = undefined,
    forceDeleteIfNullOrDefault = false
  ) {
    if (
      propertyValue === null ||
      propertyValue === undefined ||
      propertyValue === defaultValue
    ) {
      if (
        !GlobalSettings.enableFullJsonRoundTrip ||
        forceDeleteIfNullOrDefault
      ) {
        delete target[propertyName];
      }
    } else {
      target[propertyName] = propertyValue;
    }
  }

  serializeString(
    target: { [key: string]: any },
    propertyName: string,
    propertyValue?: string,
    defaultValue?: string
  ) {
    if (
      propertyValue === null ||
      propertyValue === undefined ||
      propertyValue === defaultValue
    ) {
      if (!GlobalSettings.enableFullJsonRoundTrip) {
        delete target[propertyName];
      }
    } else {
      target[propertyName] = propertyValue;
    }
  }

  serializeDate(
    target: { [key: string]: any },
    propertyName: string,
    propertyValue?: Date,
    defaultValue?: Date
  ) {
    if (
      propertyValue === null ||
      propertyValue === undefined ||
      propertyValue === defaultValue
    ) {
      if (!GlobalSettings.enableFullJsonRoundTrip) {
        delete target[propertyName];
      }
    } else {
      target[propertyName] = dateToString(propertyValue);
    }
  }

  serializeBool(
    target: { [key: string]: any },
    propertyName: string,
    propertyValue?: boolean,
    defaultValue?: boolean
  ) {
    if (
      propertyValue === null ||
      propertyValue === undefined ||
      propertyValue === defaultValue
    ) {
      if (!GlobalSettings.enableFullJsonRoundTrip) {
        delete target[propertyName];
      }
    } else {
      target[propertyName] = propertyValue;
    }
  }

  serializeNumber(
    target: { [key: string]: any },
    propertyName: string,
    propertyValue?: number,
    defaultValue?: number
  ) {
    if (
      propertyValue === null ||
      propertyValue === undefined ||
      propertyValue === defaultValue ||
      isNaN(propertyValue)
    ) {
      if (!GlobalSettings.enableFullJsonRoundTrip) {
        delete target[propertyName];
      }
    } else {
      target[propertyName] = propertyValue;
    }
  }

  serializeEnum(
    enumType: { [s: number]: string },
    target: { [key: string]: any },
    propertyName: string,
    propertyValue: number | undefined,
    defaultValue: number | undefined = undefined
  ) {
    if (
      propertyValue === null ||
      propertyValue === undefined ||
      propertyValue === defaultValue
    ) {
      if (!GlobalSettings.enableFullJsonRoundTrip) {
        delete target[propertyName];
      }
    } else {
      target[propertyName] = enumType[propertyValue];
    }
  }

  serializeArray(
    target: { [key: string]: any },
    propertyName: string,
    propertyValue: any[] | undefined
  ) {
    const items = [];

    if (propertyValue) {
      for (const item of propertyValue) {
        let serializedItem: any;

        if (item instanceof SerializableObject) {
          serializedItem = item.toJSON(this);
        } else if (item.toJSON) {
          serializedItem = item.toJSON();
        } else {
          serializedItem = item;
        }

        if (serializedItem !== undefined) {
          items.push(serializedItem);
        }
      }
    }

    if (items.length === 0) {
      if (
        target.hasOwnProperty(propertyName) &&
        Array.isArray(target[propertyName])
      ) {
        delete target[propertyName];
      }
    } else {
      this.serializeValue(target, propertyName, items);
    }
  }

  clearEvents() {
    this._validationEvents = [];
  }

  logEvent(
    source: SerializableObject | undefined,
    phase: ValidationPhase,
    event: ValidationEvent,
    message: string
  ) {
    this._validationEvents.push({
      source,
      phase,
      event,
      message,
    });
  }

  logParseEvent(
    source: SerializableObject | undefined,
    event: ValidationEvent,
    message: string
  ) {
    this.logEvent(source, ValidationPhase.Parse, event, message);
  }

  getEventAt(index: number): IValidationEvent {
    return this._validationEvents[index];
  }

  get eventCount(): number {
    return this._validationEvents.length;
  }
}

class SimpleSerializationContext extends BaseSerializationContext {}

export class PropertyDefinition {
  private static _sequentialNumber = 0;

  getInternalName(): string {
    return this.name;
  }

  parse(
    _sender: SerializableObject,
    source: PropertyBag,
    _context: BaseSerializationContext
  ): any {
    return source[this.name];
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: any,
    context: BaseSerializationContext
  ): void {
    context.serializeValue(target, this.name, value, this.defaultValue);
  }

  preProcessValue(value: any): any {
    return value;
  }

  readonly sequentialNumber: number;

  isSerializationEnabled = true;

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly defaultValue?: any,
    readonly onGetInitialValue?: (sender: SerializableObject) => any
  ) {
    this.sequentialNumber = PropertyDefinition._sequentialNumber;

    PropertyDefinition._sequentialNumber++;
  }
}

export class StringProperty extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): string | undefined {
    let parsedValue = parseString(source[this.name], this.defaultValue);

    if (parsedValue === "" && this.treatEmptyAsUndefined) {
      parsedValue = undefined;
    }

    if (parsedValue && this.regEx !== undefined) {
      const matches = this.regEx.exec(parsedValue);

      if (!matches) {
        context.logParseEvent(
          sender,
          ValidationEvent.InvalidPropertyValue,
          Strings.errors.invalidPropertyValue(parsedValue, this.name)
        );

        return undefined;
      }
    }

    return parsedValue;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: string | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeString(
      target,
      this.name,
      value === "" && this.treatEmptyAsUndefined ? undefined : value,
      this.defaultValue
    );
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly treatEmptyAsUndefined: boolean = true,
    readonly regEx?: RegExp,
    readonly defaultValue?: string,
    readonly onGetInitialValue?: (sender: SerializableObject) => string
  ) {
    super(targetVersion, name, defaultValue, onGetInitialValue);
  }
}

export class BoolProperty extends PropertyDefinition {
  parse(
    _sender: SerializableObject,
    source: PropertyBag,
    _context: BaseSerializationContext
  ): boolean | undefined {
    return parseBool(source[this.name], this.defaultValue);
  }

  toJSON(
    _sender: SerializableObject,
    target: object,
    value: boolean | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeBool(target, this.name, value, this.defaultValue);
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly defaultValue?: boolean,
    readonly onGetInitialValue?: (sender: SerializableObject) => any
  ) {
    super(targetVersion, name, defaultValue, onGetInitialValue);
  }
}

export class NumProperty extends PropertyDefinition {
  parse(
    _sender: SerializableObject,
    source: PropertyBag,
    _context: BaseSerializationContext
  ): number | undefined {
    return parseNumber(source[this.name], this.defaultValue);
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: number | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeNumber(target, this.name, value, this.defaultValue);
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly defaultValue?: number,
    readonly onGetInitialValue?: (sender: SerializableObject) => any
  ) {
    super(targetVersion, name, defaultValue, onGetInitialValue);
  }
}

export class PixelSizeProperty extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): number | undefined {
    let result: number | undefined;
    const value = source[this.name];

    if (typeof value === "string") {
      let isValid = false;

      try {
        const size = SizeAndUnit.parse(value, true);

        if (size.unit === SizeUnit.Pixel) {
          result = size.physicalSize;

          isValid = true;
        }
      } catch {
        // Do nothing. A parse error is emitted below
      }

      if (!isValid) {
        context.logParseEvent(
          sender,
          ValidationEvent.InvalidPropertyValue,
          Strings.errors.invalidPropertyValue(source[this.name], "minHeight")
        );
      }
    }

    return result;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: number | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeValue(
      target,
      this.name,
      typeof value === "number" && !isNaN(value) ? `${value}px` : undefined
    );
  }
}

export interface IVersionedValue<TValue> {
  value: TValue;
  targetVersion?: Version;
}

export class StringArrayProperty extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): string[] | undefined {
    const sourceValue = source[this.name];

    if (sourceValue === undefined || !Array.isArray(sourceValue)) {
      return this.defaultValue;
    }

    const result: string[] = [];

    for (const value of sourceValue) {
      if (typeof value === "string") {
        result.push(value);
      } else {
        context.logParseEvent(
          sender,
          ValidationEvent.InvalidPropertyValue,
          `Invalid array value "${JSON.stringify(
            value
          )}" of type "${typeof value}" ignored for "${this.name}".`
        );
      }
    }

    return result;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: string[] | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeArray(target, this.name, value);
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly defaultValue?: string[],
    readonly onGetInitialValue?: (
      sender: SerializableObject
    ) => string[] | undefined
  ) {
    super(targetVersion, name, defaultValue, onGetInitialValue);
  }
}

export class ValueSetProperty extends PropertyDefinition {
  isValidValue(value: string, context: BaseSerializationContext): boolean {
    for (const versionedValue of this.values) {
      if (value.toLowerCase() === versionedValue.value.toLowerCase()) {
        const targetVersion = versionedValue.targetVersion
          ? versionedValue.targetVersion
          : this.targetVersion;

        return targetVersion.compareTo(context.targetVersion) <= 0;
      }
    }

    return false;
  }

  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): string | undefined {
    const sourceValue = source[this.name];

    if (sourceValue === undefined) {
      return this.defaultValue;
    }

    if (typeof sourceValue === "string") {
      for (const versionedValue of this.values) {
        if (sourceValue.toLowerCase() === versionedValue.value.toLowerCase()) {
          const targetVersion = versionedValue.targetVersion
            ? versionedValue.targetVersion
            : this.targetVersion;

          if (targetVersion.compareTo(context.targetVersion) <= 0) {
            return versionedValue.value;
          } else {
            context.logParseEvent(
              sender,
              ValidationEvent.InvalidPropertyValue,
              Strings.errors.propertyValueNotSupported(
                sourceValue,
                this.name,
                targetVersion.toString(),
                context.targetVersion.toString()
              )
            );

            return this.defaultValue;
          }
        }
      }
    }

    context.logParseEvent(
      sender,
      ValidationEvent.InvalidPropertyValue,
      Strings.errors.invalidPropertyValue(sourceValue, this.name)
    );

    return this.defaultValue;
  }

  toJSON(
    sender: SerializableObject,
    target: PropertyBag,
    value: string | undefined,
    context: BaseSerializationContext
  ) {
    let invalidValue = false;

    if (value !== undefined) {
      invalidValue = true;

      for (const versionedValue of this.values) {
        if (versionedValue.value === value) {
          const targetVersion = versionedValue.targetVersion
            ? versionedValue.targetVersion
            : this.targetVersion;

          if (targetVersion.compareTo(context.targetVersion) <= 0) {
            invalidValue = false;

            break;
          } else {
            context.logEvent(
              sender,
              ValidationPhase.ToJSON,
              ValidationEvent.InvalidPropertyValue,
              Strings.errors.propertyValueNotSupported(
                value,
                this.name,
                targetVersion.toString(),
                context.targetVersion.toString()
              )
            );
          }
        }
      }
    }

    if (!invalidValue) {
      context.serializeValue(target, this.name, value, this.defaultValue, true);
    }
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly values: IVersionedValue<string>[],
    readonly defaultValue?: string,
    readonly onGetInitialValue?: (sender: SerializableObject) => string
  ) {
    super(targetVersion, name, defaultValue, onGetInitialValue);
  }
}

export class EnumProperty<
  TEnum extends { [s: number]: string }
> extends PropertyDefinition {
  private _values: IVersionedValue<number>[] = [];

  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): number | undefined {
    const sourceValue = source[this.name];

    if (typeof sourceValue !== "string") {
      return this.defaultValue;
    }

    const enumValue = getEnumValueByName(this.enumType, sourceValue);

    if (enumValue !== undefined) {
      for (const versionedValue of this.values) {
        if (versionedValue.value === enumValue) {
          const targetVersion = versionedValue.targetVersion
            ? versionedValue.targetVersion
            : this.targetVersion;

          if (targetVersion.compareTo(context.targetVersion) <= 0) {
            return enumValue;
          } else {
            context.logParseEvent(
              sender,
              ValidationEvent.InvalidPropertyValue,
              Strings.errors.propertyValueNotSupported(
                sourceValue,
                this.name,
                targetVersion.toString(),
                context.targetVersion.toString()
              )
            );

            return this.defaultValue;
          }
        }
      }
    }

    context.logParseEvent(
      sender,
      ValidationEvent.InvalidPropertyValue,
      Strings.errors.invalidPropertyValue(sourceValue, this.name)
    );

    return this.defaultValue;
  }

  toJSON(
    sender: SerializableObject,
    target: PropertyBag,
    value: number | undefined,
    context: BaseSerializationContext
  ) {
    let invalidValue = false;

    if (value !== undefined) {
      invalidValue = true;

      for (const versionedValue of this.values) {
        if (versionedValue.value === value) {
          const targetVersion = versionedValue.targetVersion
            ? versionedValue.targetVersion
            : this.targetVersion;

          if (targetVersion.compareTo(context.targetVersion) <= 0) {
            invalidValue = false;

            break;
          } else {
            context.logEvent(
              sender,
              ValidationPhase.ToJSON,
              ValidationEvent.InvalidPropertyValue,
              Strings.errors.invalidPropertyValue(value, this.name)
            );
          }
        }
      }
    }

    if (!invalidValue) {
      context.serializeEnum(
        this.enumType,
        target,
        this.name,
        value,
        this.defaultValue
      );
    }
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly enumType: TEnum,
    readonly defaultValue?: number,
    values?: IVersionedValue<number>[],
    readonly onGetInitialValue?: (sender: SerializableObject) => number
  ) {
    super(targetVersion, name, defaultValue, onGetInitialValue);

    if (!values) {
      // eslint-disable-next-line guard-for-in
      for (const key in enumType) {
        const keyAsNumber = parseInt(key, 10);

        if (keyAsNumber >= 0) {
          this._values.push({ value: keyAsNumber });
        }
      }
    } else {
      this._values = values;
    }
  }

  get values(): IVersionedValue<number>[] {
    return this._values;
  }
}

export type SerializableObjectType = { new (): SerializableObject };

export class SerializableObjectProperty extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): SerializableObject | undefined {
    const sourceValue = source[this.name];

    if (sourceValue === undefined) {
      return this.onGetInitialValue
        ? this.onGetInitialValue(sender)
        : this.defaultValue;
    }

    const result = this.createInstance(source);
    result.parse(sourceValue, context);

    return result;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: SerializableObject | undefined,
    context: BaseSerializationContext
  ) {
    let serializedValue: object | undefined;

    if (value !== undefined && !value.hasAllDefaultValues()) {
      serializedValue = value.toJSON(context);
    }

    if (
      typeof serializedValue === "object" &&
      Object.keys(serializedValue).length === 0
    ) {
      serializedValue = undefined;
    }

    context.serializeValue(
      target,
      this.name,
      serializedValue,
      this.defaultValue,
      true
    );
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly createInstance: (source?: PropertyBag) => SerializableObject,
    readonly nullable: boolean = false,
    defaultValue?: SerializableObject
  ) {
    super(targetVersion, name, defaultValue, (_sender: SerializableObject) => {
      return this.nullable ? undefined : this.createInstance();
    });
  }
}

export class TypedSerializableObjectProperty extends SerializableObjectProperty {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): SerializableObject | undefined {
    const sourceValue = source[this.name];

    if (
      typeof sourceValue === "object" &&
      "type" in sourceValue &&
      sourceValue.type === this.objectTypeName
    ) {
      return super.parse(sender, source, context);
    }

    return undefined;
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly objectTypeName: string,
    readonly createInstance: (source?: PropertyBag) => SerializableObject,
    readonly nullable: boolean = false,
    defaultValue?: SerializableObject
  ) {
    super(targetVersion, name, createInstance, nullable, defaultValue);
  }
}

export class SerializableObjectCollectionProperty extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): SerializableObject[] | undefined {
    const result: SerializableObject[] | undefined = [];

    const sourceCollection = source[this.name];

    if (Array.isArray(sourceCollection)) {
      for (const sourceItem of sourceCollection) {
        const item = this.createInstance(sourceItem);

        if (item) {
          item.parse(sourceItem, context);

          result.push(item);

          if (this.onItemAdded) {
            this.onItemAdded(sender, item);
          }
        }
      }
    }

    return result.length > 0
      ? result
      : this.onGetInitialValue
      ? this.onGetInitialValue(sender)
      : undefined;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: SerializableObject[] | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeArray(target, this.name, value);
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly createInstance: (
      source?: PropertyBag
    ) => SerializableObject | undefined,
    readonly onItemAdded?: (
      sender: SerializableObject,
      item: SerializableObject
    ) => void
  ) {
    super(targetVersion, name, undefined, (_sender: SerializableObject) => {
      return [];
    });
  }
}

export class CustomProperty<T> extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): T {
    return this.onParse(sender, this, source, context);
  }

  toJSON(
    sender: SerializableObject,
    target: PropertyBag,
    value: T,
    context: BaseSerializationContext
  ) {
    this.onToJSON(sender, this, target, value, context);
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly onParse: (
      sender: SerializableObject,
      property: PropertyDefinition,
      source: PropertyBag,
      context: BaseSerializationContext
    ) => T,
    readonly onToJSON: (
      sender: SerializableObject,
      property: PropertyDefinition,
      target: PropertyBag,
      value: T,
      context: BaseSerializationContext
    ) => void,
    readonly defaultValue?: T,
    readonly onGetInitialValue?: (sender: SerializableObject) => T
  ) {
    super(targetVersion, name, defaultValue, onGetInitialValue);

    if (!this.onParse) {
      throw new Error(
        "CustomPropertyDefinition instances must have an onParse handler."
      );
    }

    if (!this.onToJSON) {
      throw new Error(
        "CustomPropertyDefinition instances must have an onToJSON handler."
      );
    }
  }
}

export class SerializableObjectSchema {
  private _properties: PropertyDefinition[] = [];

  constructor(public readonly key: string) {}

  indexOf(prop: PropertyDefinition): number {
    for (let i = 0; i < this._properties.length; i++) {
      if (this._properties[i] === prop) {
        return i;
      }
    }

    return -1;
  }

  add(...properties: PropertyDefinition[]) {
    for (const prop of properties) {
      if (this.indexOf(prop) === -1) {
        this._properties.push(prop);
      }
    }
  }

  remove(...properties: PropertyDefinition[]) {
    for (const prop of properties) {
      /* eslint-disable-next-line no-constant-condition */
      while (true) {
        const index = this.indexOf(prop);

        if (index >= 0) {
          this._properties.splice(index, 1);
        } else {
          break;
        }
      }
    }
  }

  getItemAt(index: number): PropertyDefinition {
    return this._properties[index];
  }

  getCount(): number {
    return this._properties.length;
  }
}

export type PropertyBag = { [propertyName: string]: any };

export abstract class SerializableObject {
  private static currentKey = 0;

  static onRegisterCustomProperties?: (
    sender: SerializableObject,
    schema: SerializableObjectSchema
  ) => void;

  static defaultMaxVersion: Version = Versions.latest;

  private static readonly _schemaCache: {
    [typeName: string]: SerializableObjectSchema;
  } = {};

  private _isParsing = false;
  private _propertyBag: PropertyBag = {};
  private _rawProperties: PropertyBag = {};

  protected abstract getSchemaKey(): string;

  protected propertyChanged(property: PropertyDefinition, newValue: any) {
    if (this.onPropertyChanged) {
      this.onPropertyChanged(this, property, newValue);
    }
  }

  protected afterParse() {
    // Do nothing in base implementation
  }

  protected getDefaultSerializationContext(): BaseSerializationContext {
    return new SimpleSerializationContext();
  }

  protected populateSchema(schema: SerializableObjectSchema) {
    const properties: PropertyDefinition[] = [];

    // eslint-disable-next-line guard-for-in
    for (const propertyName in this.constructor) {
      try {
        const propertyValue = (this.constructor as any)[propertyName];

        if (propertyValue instanceof PropertyDefinition) {
          properties.push(propertyValue);
        }
      } catch {
        // If a property happens to have a getter function and
        // it throws an exception, we need to catch it here
      }
    }

    if (properties.length > 0) {
      const sortedProperties = properties.sort(
        (p1: PropertyDefinition, p2: PropertyDefinition) => {
          if (p1.sequentialNumber > p2.sequentialNumber) {
            return 1;
          } else if (p1.sequentialNumber < p2.sequentialNumber) {
            return -1;
          }

          return 0;
        }
      );

      schema.add(...sortedProperties);
    }

    if (SerializableObject.onRegisterCustomProperties) {
      SerializableObject.onRegisterCustomProperties(this, schema);
    }
  }

  protected internalParse(
    source: PropertyBag,
    context: BaseSerializationContext
  ) {
    if (this._isParsing) {
      return;
    }

    this._isParsing = true;

    try {
      this._propertyBag = {};
      this._rawProperties = GlobalSettings.enableFullJsonRoundTrip
        ? source
          ? source
          : {}
        : {};

      if (source) {
        const s = this.getSchema();

        for (let i = 0; i < s.getCount(); i++) {
          const prop = s.getItemAt(i);

          if (prop.isSerializationEnabled) {
            let propertyValue = prop.onGetInitialValue
              ? prop.onGetInitialValue(this)
              : undefined;

            if (source.hasOwnProperty(prop.name)) {
              if (prop.targetVersion.compareTo(context.targetVersion) <= 0) {
                propertyValue = prop.parse(this, source, context);
              } else {
                context.logParseEvent(
                  this,
                  ValidationEvent.UnsupportedProperty,
                  Strings.errors.propertyNotSupported(
                    prop.name,
                    prop.targetVersion.toString(),
                    context.targetVersion.toString()
                  )
                );
              }
            }

            this.setValue(prop, propertyValue);
          }
        }
      } else {
        this.resetDefaultValues();
      }
    } finally {
      this._isParsing = false;

      this.afterParse();
    }
  }

  protected internalToJSON(
    target: PropertyBag,
    context: BaseSerializationContext
  ) {
    const s = this.getSchema();
    const serializedProperties: string[] = [];

    for (let i = 0; i < s.getCount(); i++) {
      const prop = s.getItemAt(i);

      // Avoid serializing the same property multiple times. This is necessary
      // because some property definitions map to the same underlying schema
      // property
      if (
        prop.isSerializationEnabled &&
        prop.targetVersion.compareTo(context.targetVersion) <= 0 &&
        serializedProperties.indexOf(prop.name) === -1
      ) {
        prop.toJSON(this, target, this.getValue(prop), context);

        serializedProperties.push(prop.name);
      }
    }
  }

  protected shouldSerialize(_context: BaseSerializationContext): boolean {
    return true;
  }

  onPropertyChanged?: (
    sender: SerializableObject,
    property: PropertyDefinition,
    newValue: any
  ) => void;

  readonly key = SerializableObject.currentKey++;

  maxVersion: Version = SerializableObject.defaultMaxVersion;

  constructor() {
    const s = this.getSchema();

    for (let i = 0; i < s.getCount(); i++) {
      const prop = s.getItemAt(i);

      if (prop.onGetInitialValue) {
        this.setValue(prop, prop.onGetInitialValue(this));
      }
    }
  }

  getValue(prop: PropertyDefinition): any {
    return this._propertyBag.hasOwnProperty(prop.getInternalName())
      ? this._propertyBag[prop.getInternalName()]
      : prop.defaultValue;
  }

  setValue(prop: PropertyDefinition, value: any) {
    const notifyPropertyChanged = (
      property: PropertyDefinition,
      newValue: any
    ) => {
      if (!this._isParsing) {
        this.propertyChanged(property, newValue);
      }
    };

    if (value === undefined || value === null) {
      if (this._propertyBag.hasOwnProperty(prop.getInternalName())) {
        delete this._propertyBag[prop.getInternalName()];

        notifyPropertyChanged(prop, value);
      }
    } else {
      const preProcessedValue = prop.preProcessValue(value);

      if (this._propertyBag[prop.getInternalName()] !== preProcessedValue) {
        this._propertyBag[prop.getInternalName()] = preProcessedValue;

        notifyPropertyChanged(prop, preProcessedValue);
      }
    }
  }

  parse(source: PropertyBag, context?: BaseSerializationContext) {
    const effectiveContext = context
      ? context
      : this.getDefaultSerializationContext();

    this.internalParse(source, effectiveContext);

    if (effectiveContext.onAfterObjectParsed) {
      effectiveContext.onAfterObjectParsed(this, source);
    }
  }

  toJSON(context?: BaseSerializationContext): PropertyBag | undefined {
    let effectiveContext: BaseSerializationContext;

    if (context && context instanceof BaseSerializationContext) {
      effectiveContext = context;
    } else {
      effectiveContext = this.getDefaultSerializationContext();
      effectiveContext.toJSONOriginalParam = context;
    }

    if (this.shouldSerialize(effectiveContext)) {
      let result: PropertyBag;

      if (
        GlobalSettings.enableFullJsonRoundTrip &&
        this._rawProperties &&
        typeof this._rawProperties === "object"
      ) {
        result = this._rawProperties;
      } else {
        result = {};
      }

      this.internalToJSON(result, effectiveContext);

      return result;
    } else {
      return undefined;
    }
  }

  hasDefaultValue(prop: PropertyDefinition): boolean {
    return this.getValue(prop) === prop.defaultValue;
  }

  hasAllDefaultValues(): boolean {
    const s = this.getSchema();

    for (let i = 0; i < s.getCount(); i++) {
      const prop = s.getItemAt(i);

      if (!this.hasDefaultValue(prop)) {
        return false;
      }
    }

    return true;
  }

  resetDefaultValues() {
    const s = this.getSchema();

    for (let i = 0; i < s.getCount(); i++) {
      const prop = s.getItemAt(i);

      this.setValue(prop, prop.defaultValue);
    }
  }

  setCustomProperty(name: string, value: any) {
    const shouldDeleteProperty =
      (typeof value === "string" && !value) ||
      value === undefined ||
      value === null;

    if (shouldDeleteProperty) {
      delete this._rawProperties[name];
    } else {
      this._rawProperties[name] = value;
    }
  }

  getCustomProperty(name: string): any {
    return this._rawProperties[name];
  }

  getSchema(): SerializableObjectSchema {
    let schema: SerializableObjectSchema =
      SerializableObject._schemaCache[this.getSchemaKey()];

    if (!schema) {
      schema = new SerializableObjectSchema(this.getSchemaKey());

      this.populateSchema(schema);

      SerializableObject._schemaCache[schema.key] = schema;
    }

    return schema;
  }
}

export abstract class TypedSerializableObject extends SerializableObject {
  static readonly typeNameProperty = new StringProperty(
    Versions.v1_0,
    "type",
    undefined,
    undefined,
    undefined,
    (sender: object) => {
      return (sender as TypedSerializableObject).getJsonTypeName();
    }
  );

  protected getSchemaKey(): string {
    return this.getJsonTypeName();
  }

  abstract getJsonTypeName(): string;
}
