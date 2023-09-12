import type {
  BaseSerializationContext,
  PropertyBag,
  SerializableObject,
  Version,
} from "../core";
import {
  dateToString,
  PropertyDefinition,
  StringProperty,
  Strings,
  ValidationEvent,
  Versions,
} from "../core";
import { Input } from "./input";

export class DateProperty extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): Date | undefined {
    const regEx = /^(\d{4})-(\d{2})-(\d{2})$/;
    const propertyValue = source[this.name];

    let hasError = false;

    if (typeof propertyValue !== "string") {
      hasError = true;
    } else {
      const matches = regEx.exec(propertyValue);
      const expectedMatchCount = 4;

      if (matches && matches.length === expectedMatchCount) {
        const year = parseInt(matches[1], 10);
        const month = parseInt(matches[2], 10) - 1; // Months start from 0 in JS
        const day = parseInt(matches[3], 10);

        return new Date(year, month, day);
      }

      hasError = true;
    }

    if (hasError) {
      context.logParseEvent(
        sender,
        ValidationEvent.InvalidPropertyValue,
        Strings.errors.invalidPropertyValue(propertyValue, this.name)
      );
    }

    return this.defaultValue;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: Date | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeDate(target, this.name, value, this.defaultValue);
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly defaultValue?: Date
  ) {
    super(targetVersion, name, defaultValue);
  }
}

export abstract class DateInputBase extends Input {
  // #region Schema

  static readonly valueProperty = new DateProperty(Versions.v1_0, "value");
  static readonly placeholderProperty = new StringProperty(
    Versions.v1_0,
    "placeholder"
  );
  static readonly minProperty = new DateProperty(Versions.v1_0, "min");
  static readonly maxProperty = new DateProperty(Versions.v1_0, "max");

  get defaultValue(): Date | undefined {
    return this.getValue(DateInputBase.valueProperty);
  }

  set defaultValue(value: Date | undefined) {
    this.setValue(DateInputBase.valueProperty, value);
  }

  get min(): Date | undefined {
    return this.getValue(DateInputBase.minProperty);
  }

  set min(value: Date | undefined) {
    this.setValue(DateInputBase.minProperty, value);
  }

  get max(): Date | undefined {
    return this.getValue(DateInputBase.maxProperty);
  }

  set max(value: Date | undefined) {
    this.setValue(DateInputBase.maxProperty, value);
  }

  get placeholder(): string | undefined {
    return this.getValue(DateInputBase.placeholderProperty);
  }

  set placeholder(value: string | undefined) {
    this.setValue(DateInputBase.placeholderProperty, value);
  }

  // #endregion

  getJsonTypeName(): string {
    return "Input.Date";
  }

  isSet(): boolean {
    return this.value ? true : false;
  }

  isValid(): boolean {
    if (!this.value) {
      return !this.isRequired;
    }

    let result = true;

    if (this.min) {
      result = result && this.value >= this.min;
    }

    if (this.max) {
      result = result && this.value <= this.max;
    }

    return result;
  }

  get value(): Date | undefined {
    return this._value;
  }

  get valueAsString(): string | undefined {
    if (this.value !== undefined) {
      return dateToString(this.value);
    }

    return undefined;
  }
}
