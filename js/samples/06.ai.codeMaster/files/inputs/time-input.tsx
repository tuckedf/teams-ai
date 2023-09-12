import type {
  BaseSerializationContext,
  PropertyBag,
  PropertyDefinition,
  SerializableObject,
  Version,
} from "../core";
import { CustomProperty, StringProperty, Versions } from "../core";
import { Input } from "./input";

function convertTimeStringToDate(timeString: string): Date {
  return new Date(`1973-09-04T${timeString}:00Z`);
}

export class TimeProperty extends CustomProperty<string | undefined> {
  static readonly validationRegEx = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

  static validateTimeString(timeString: string | undefined): boolean {
    return (
      timeString === undefined || TimeProperty.validationRegEx.test(timeString)
    );
  }

  constructor(readonly targetVersion: Version, readonly name: string) {
    super(
      targetVersion,
      name,
      (
        _sender: SerializableObject,
        prop: PropertyDefinition,
        source: PropertyBag,
        _context: BaseSerializationContext
      ) => {
        const value = source[prop.name];

        if (
          typeof value === "string" &&
          value &&
          TimeProperty.validateTimeString(value)
        ) {
          return value;
        }

        return undefined;
      },
      (
        _sender: SerializableObject,
        prop: PropertyDefinition,
        target: PropertyBag,
        value: string | undefined,
        context: BaseSerializationContext
      ) => {
        context.serializeValue(target, prop.name, value);
      }
    );
  }

  preProcessValue(value: string | undefined): string | undefined {
    return TimeProperty.validateTimeString(value) ? value : undefined;
  }
}

export abstract class TimeInputBase extends Input {
  // #region Schema

  static readonly valueProperty = new TimeProperty(Versions.v1_0, "value");
  static readonly placeholderProperty = new StringProperty(
    Versions.v1_0,
    "placeholder"
  );
  static readonly minProperty = new TimeProperty(Versions.v1_0, "min");
  static readonly maxProperty = new TimeProperty(Versions.v1_0, "max");

  get defaultValue(): string | undefined {
    return this.getValue(TimeInputBase.valueProperty);
  }

  set defaultValue(value: string | undefined) {
    this.setValue(TimeInputBase.valueProperty, value);
  }

  get min(): string | undefined {
    return this.getValue(TimeInputBase.minProperty);
  }

  set min(value: string | undefined) {
    this.setValue(TimeInputBase.minProperty, value);
  }

  get max(): string | undefined {
    return this.getValue(TimeInputBase.maxProperty);
  }

  set max(value: string | undefined) {
    this.setValue(TimeInputBase.maxProperty, value);
  }

  get placeholder(): string | undefined {
    return this.getValue(TimeInputBase.placeholderProperty);
  }

  set placeholder(value: string | undefined) {
    this.setValue(TimeInputBase.placeholderProperty, value);
  }

  // #endregion

  getJsonTypeName(): string {
    return "Input.Time";
  }

  isSet(): boolean {
    return this.value ? true : false;
  }

  isValid(): boolean {
    if (!this.value) {
      return !this.isRequired;
    }

    const valueAsDate = convertTimeStringToDate(this.value);

    let result = true;

    if (this.min) {
      const minDate = convertTimeStringToDate(this.min);

      result = result && valueAsDate >= minDate;
    }

    if (this.max) {
      const maxDate = convertTimeStringToDate(this.max);

      result = result && valueAsDate <= maxDate;
    }

    return result;
  }

  get value(): string | undefined {
    return this._value;
  }
}
