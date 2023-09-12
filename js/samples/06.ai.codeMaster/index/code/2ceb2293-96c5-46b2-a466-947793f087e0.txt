import type { IInput, PropertyDefinition, ValidationResults } from "../core";
import {
  BoolProperty,
  NumProperty,
  SerializableObject,
  SerializableObjectCollectionProperty,
  StringProperty,
  Strings,
  TypedSerializableObject,
  TypedSerializableObjectProperty,
  ValidationEvent,
  ValueSetProperty,
  Versions,
} from "../core";
import type { AssociatedInputsType } from "../core/core-objects";
import { AssociatedInputsProperty } from "../core/core-objects";
import { Input } from "./input";

export class Choice extends SerializableObject {
  // #region Schema

  static readonly titleProperty = new StringProperty(Versions.v1_0, "title");
  static readonly valueProperty = new StringProperty(Versions.v1_0, "value");

  get title(): string | undefined {
    return this.getValue(Choice.titleProperty);
  }

  set title(value: string | undefined) {
    this.setValue(Choice.titleProperty, value);
  }

  get value(): string | undefined {
    return this.getValue(Choice.valueProperty);
  }

  set value(value: string | undefined) {
    this.setValue(Choice.valueProperty, value);
  }

  // #endregion

  protected getSchemaKey(): string {
    return "Choice";
  }

  constructor(title?: string, value?: string) {
    super();

    this.title = title;
    this.value = value;
  }
}

export type ChoiceSetInputStyle = "compact" | "expanded" | "filtered";

export class DataQuery extends TypedSerializableObject {
  // #region Schema

  static readonly datasetProperty = new StringProperty(
    Versions.v1_0,
    "dataset"
  );
  static readonly associatedInputsProperty = new AssociatedInputsProperty(
    Versions.v1_0,
    "associatedInputs"
  );
  static readonly countProperty = new NumProperty(Versions.v1_0, "count");
  static readonly skipProperty = new NumProperty(Versions.v1_0, "skip");

  get dataset(): string | undefined {
    return this.getValue(DataQuery.datasetProperty);
  }

  set dataset(value: string | undefined) {
    this.setValue(DataQuery.datasetProperty, value);
  }

  get count(): number | undefined {
    return this.getValue(DataQuery.countProperty);
  }

  set count(value: number | undefined) {
    this.setValue(DataQuery.countProperty, value);
  }

  get skip(): number | undefined {
    return this.getValue(DataQuery.skipProperty);
  }

  set skip(value: number | undefined) {
    this.setValue(DataQuery.skipProperty, value);
  }

  get associatedInputs(): AssociatedInputsType {
    return this.getValue(DataQuery.associatedInputsProperty);
  }

  set associatedInputs(value: AssociatedInputsType) {
    this.setValue(DataQuery.associatedInputsProperty, value);
  }

  // #endregion

  getJsonTypeName(): string {
    return "Data.Query";
  }
}

export abstract class ChoiceSetInputBase extends Input {
  // #region Schema

  static readonly valueProperty = new StringProperty(Versions.v1_0, "value");
  static readonly choicesProperty = new SerializableObjectCollectionProperty(
    Versions.v1_0,
    "choices",
    (_) => new Choice()
  );
  static readonly choicesDataProperty = new TypedSerializableObjectProperty(
    Versions.v1_5,
    "choices.data",
    "Data.Query",
    (_) => new DataQuery(),
    true
  );
  static readonly styleProperty = new ValueSetProperty(
    Versions.v1_0,
    "style",
    [
      { value: "compact" },
      { value: "expanded" },
      { value: "filtered", targetVersion: Versions.v1_5 },
    ],
    "compact"
  );
  static readonly isMultiSelectProperty = new BoolProperty(
    Versions.v1_0,
    "isMultiSelect",
    false
  );
  static readonly placeholderProperty = new StringProperty(
    Versions.v1_0,
    "placeholder"
  );
  static readonly wrapProperty = new BoolProperty(Versions.v1_2, "wrap", false);

  get defaultValue(): string | undefined {
    return this.getValue(ChoiceSetInputBase.valueProperty);
  }

  set defaultValue(value: string | undefined) {
    this.setValue(ChoiceSetInputBase.valueProperty, value);
  }

  get style(): ChoiceSetInputStyle | undefined {
    return this.getValue(ChoiceSetInputBase.styleProperty);
  }

  set style(value: ChoiceSetInputStyle | undefined) {
    this.setValue(ChoiceSetInputBase.styleProperty, value);
  }

  get isMultiSelect(): boolean {
    return this.getValue(ChoiceSetInputBase.isMultiSelectProperty);
  }

  set isMultiSelect(value: boolean) {
    this.setValue(ChoiceSetInputBase.isMultiSelectProperty, value);
  }

  get placeholder(): string | undefined {
    return this.getValue(ChoiceSetInputBase.placeholderProperty);
  }

  set placeholder(value: string | undefined) {
    this.setValue(ChoiceSetInputBase.placeholderProperty, value);
  }

  get wrap(): boolean {
    return this.getValue(ChoiceSetInputBase.wrapProperty);
  }

  set wrap(value: boolean) {
    this.setValue(ChoiceSetInputBase.wrapProperty, value);
  }

  get choices(): Choice[] {
    return this.getValue(ChoiceSetInputBase.choicesProperty);
  }

  set choices(value: Choice[]) {
    this.setValue(ChoiceSetInputBase.choicesProperty, value);
  }

  get choicesData(): DataQuery | undefined {
    return this.getValue(ChoiceSetInputBase.choicesDataProperty);
  }

  set choicesData(value: DataQuery | undefined) {
    this.setValue(ChoiceSetInputBase.choicesDataProperty, value);
  }

  // #endregion

  protected readonly selectedValues: Set<string> = new Set<string>();

  protected propertyChanged(property: PropertyDefinition, newValue: any) {
    super.propertyChanged(property, newValue);

    if (property === ChoiceSetInputBase.valueProperty) {
      const selectedValues = this.defaultValue
        ? this.defaultValue.split(this.hostConfig.choiceSetInputValueSeparator)
        : [];

      this.selectedValues.clear();

      selectedValues.forEach((value) => this.selectedValues.add(value));
    }
  }

  getJsonTypeName(): string {
    return "Input.ChoiceSet";
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    if (this.choices.length === 0) {
      context.addFailure(
        this,
        ValidationEvent.CollectionCantBeEmpty,
        Strings.errors.choiceSetMustHaveAtLeastOneChoice()
      );
    }

    for (const choice of this.choices) {
      if (!choice.title || !choice.value) {
        context.addFailure(
          this,
          ValidationEvent.PropertyCantBeNull,
          Strings.errors.choiceSetChoicesMustHaveTitleAndValue()
        );
      }
    }
  }

  isSet(): boolean {
    return this.value ? true : false;
  }

  isValid(): boolean {
    if (this.value === "" || this.value === undefined || this.choicesData) {
      return true;
    }

    const selectedValues = this.isMultiSelect
      ? this.value.split(this.hostConfig.choiceSetInputValueSeparator)
      : [this.value];

    const validChoices = this.choices.map((choice) => choice.value);

    for (const selectedValue of selectedValues) {
      if (!validChoices.includes(selectedValue)) {
        return false;
      }
    }

    return true;
  }

  getAssociatedInputs(): IInput[] {
    if (this.choicesData && this.choicesData.associatedInputs !== "none") {
      return this.getRootElement().getAllInputs();
    }

    return [];
  }

  get value(): string | undefined {
    return this._value;
  }
}
