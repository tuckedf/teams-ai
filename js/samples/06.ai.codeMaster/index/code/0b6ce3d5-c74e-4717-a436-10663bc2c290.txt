import type {
  BaseSerializationContext,
  PropertyBag,
  SerializableObject,
} from "../core";
import { NumProperty, parseNumber, StringProperty, Versions } from "../core";
import { Input } from "./input";

class NumberInputValueProperty extends NumProperty {
  parse(
    _sender: SerializableObject,
    source: PropertyBag,
    _context: BaseSerializationContext
  ): number | undefined {
    const sourceValue = source[this.name];

    if (typeof sourceValue === "string") {
      return Number(sourceValue);
    }

    return parseNumber(sourceValue, this.defaultValue);
  }
}
export abstract class NumberInputBase extends Input {
  // #region Schema

  static readonly valueProperty: NumProperty = new NumberInputValueProperty(
    Versions.v1_0,
    "value"
  );
  static readonly placeholderProperty = new StringProperty(
    Versions.v1_0,
    "placeholder"
  );
  static readonly minProperty = new NumProperty(Versions.v1_0, "min");
  static readonly maxProperty = new NumProperty(Versions.v1_0, "max");

  get defaultValue(): number | undefined {
    return this.getValue(NumberInputBase.valueProperty);
  }

  set defaultValue(value: number | undefined) {
    this.setValue(NumberInputBase.valueProperty, value);
  }

  get min(): number | undefined {
    return this.getValue(NumberInputBase.minProperty);
  }

  set min(value: number | undefined) {
    this.setValue(NumberInputBase.minProperty, value);
  }

  get max(): number | undefined {
    return this.getValue(NumberInputBase.maxProperty);
  }

  set max(value: number | undefined) {
    this.setValue(NumberInputBase.maxProperty, value);
  }

  get placeholder(): string | undefined {
    return this.getValue(NumberInputBase.placeholderProperty);
  }

  set placeholder(value: string | undefined) {
    this.setValue(NumberInputBase.placeholderProperty, value);
  }

  // #endregion

  getJsonTypeName(): string {
    return "Input.Number";
  }

  isSet(): boolean {
    return this.value !== undefined && !isNaN(this.value);
  }

  isValid(): boolean {
    if (this.value === undefined) {
      return !this.isRequired;
    }

    let result = true;

    if (this.min !== undefined) {
      result = result && this.value >= this.min;
    }

    if (this.max !== undefined) {
      result = result && this.value <= this.max;
    }

    return result;
  }

  get value(): number | undefined {
    return this._value;
  }
}
