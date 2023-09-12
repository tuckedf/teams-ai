import type { SerializableObject } from "../core";
import { BoolProperty, StringProperty, Versions } from "../core";
import { Input } from "./input";

const defaultValueOn = "true";
const defaultValueOff = "false";

export abstract class ToggleInputBase extends Input {
  // #region Schema

  static readonly valueProperty = new StringProperty(
    Versions.v1_0,
    "value",
    undefined,
    undefined,
    defaultValueOff
  );
  static readonly titleProperty = new StringProperty(Versions.v1_0, "title");
  static readonly valueOnProperty = new StringProperty(
    Versions.v1_0,
    "valueOn",
    true,
    undefined,
    defaultValueOn,
    (_sender: SerializableObject) => {
      return defaultValueOn;
    }
  );
  static readonly valueOffProperty = new StringProperty(
    Versions.v1_0,
    "valueOff",
    true,
    undefined,
    defaultValueOff,
    (_sender: SerializableObject) => {
      return defaultValueOff;
    }
  );
  static readonly wrapProperty = new BoolProperty(Versions.v1_2, "wrap", false);

  get defaultValue(): string | undefined {
    return this.getValue(ToggleInputBase.valueProperty);
  }

  set defaultValue(value: string | undefined) {
    this.setValue(ToggleInputBase.valueProperty, value);
  }

  get title(): string | undefined {
    return this.getValue(ToggleInputBase.titleProperty);
  }

  set title(value: string | undefined) {
    this.setValue(ToggleInputBase.titleProperty, value);
  }

  get valueOn(): string {
    return this.getValue(ToggleInputBase.valueOnProperty);
  }

  set valueOn(value: string) {
    this.setValue(ToggleInputBase.valueOnProperty, value);
  }

  get valueOff(): string {
    return this.getValue(ToggleInputBase.valueOffProperty);
  }

  set valueOff(value: string) {
    this.setValue(ToggleInputBase.valueOffProperty, value);
  }

  get wrap(): boolean {
    return this.getValue(ToggleInputBase.wrapProperty);
  }

  set wrap(value: boolean) {
    this.setValue(ToggleInputBase.wrapProperty, value);
  }

  // #endregion

  protected get isNullable(): boolean {
    return false;
  }

  getJsonTypeName(): string {
    return "Input.Toggle";
  }

  isSet(): boolean {
    if (this.isRequired) {
      return this.value === this.valueOn;
    }

    return this.value ? true : false;
  }

  get value(): string | undefined {
    return this._value;
  }
}
