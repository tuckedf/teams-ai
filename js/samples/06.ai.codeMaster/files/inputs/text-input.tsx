import * as React from "react";
import { ActionProperty } from "../actions/action-property";
import type { Action, IAction } from "../core";
import {
  BoolProperty,
  EnumProperty,
  InputTextStyle,
  NumProperty,
  StringProperty,
  Versions,
} from "../core";
import { Input } from "./input";

export abstract class TextInputBase extends Input {
  public static valueChangedActionExecutionDelay = 1000;
  // #region Schema

  static readonly valueProperty = new StringProperty(Versions.v1_0, "value");
  static readonly maxLengthProperty = new NumProperty(
    Versions.v1_0,
    "maxLength"
  );
  static readonly isMultilineProperty = new BoolProperty(
    Versions.v1_0,
    "isMultiline",
    false
  );
  static readonly placeholderProperty = new StringProperty(
    Versions.v1_0,
    "placeholder"
  );
  static readonly styleProperty = new EnumProperty(
    Versions.v1_0,
    "style",
    InputTextStyle,
    InputTextStyle.Text,
    [
      { value: InputTextStyle.Text },
      { value: InputTextStyle.Tel },
      { value: InputTextStyle.Url },
      { value: InputTextStyle.Email },
      { value: InputTextStyle.Password, targetVersion: Versions.v1_5 },
    ]
  );
  static readonly inlineActionProperty = new ActionProperty(
    Versions.v1_0,
    "inlineAction",
    ["Action.ShowCard"]
  );
  static readonly regexProperty = new StringProperty(
    Versions.v1_3,
    "regex",
    true
  );

  get defaultValue(): string | undefined {
    return this.getValue(TextInputBase.valueProperty);
  }

  set defaultValue(value: string | undefined) {
    this.setValue(TextInputBase.valueProperty, value);
  }

  get maxLength(): number | undefined {
    return this.getValue(TextInputBase.maxLengthProperty);
  }

  set maxLength(value: number | undefined) {
    this.setValue(TextInputBase.maxLengthProperty, value);
  }

  get isMultiline(): boolean {
    return this.getValue(TextInputBase.isMultilineProperty);
  }

  set isMultiline(value: boolean) {
    this.setValue(TextInputBase.isMultilineProperty, value);
  }

  get placeholder(): string | undefined {
    return this.getValue(TextInputBase.placeholderProperty);
  }

  set placeholder(value: string | undefined) {
    this.setValue(TextInputBase.placeholderProperty, value);
  }

  get style(): InputTextStyle {
    return this.getValue(TextInputBase.styleProperty);
  }

  set style(value: InputTextStyle) {
    this.setValue(TextInputBase.styleProperty, value);
  }

  get inlineAction(): Action | undefined {
    return this.getValue(TextInputBase.inlineActionProperty);
  }

  set inlineAction(value: Action | undefined) {
    this.setValue(TextInputBase.inlineActionProperty, value);
  }

  get regex(): string | undefined {
    return this.getValue(TextInputBase.regexProperty);
  }

  set regex(value: string | undefined) {
    this.setValue(TextInputBase.regexProperty, value);
  }

  // #endregion

  protected renderExtraContent(): JSX.Element | null {
    if (this.inlineAction) {
      return <this.inlineAction.Render args={{ isInline: true }} />;
    }

    return null;
  }

  protected executeValueChangedAction() {
    this.valueChangedAction?.execute(
      TextInputBase.valueChangedActionExecutionDelay
    );
  }

  getJsonTypeName(): string {
    return "Input.Text";
  }

  getAllActions(): IAction[] {
    const result = super.getAllActions();

    if (this.inlineAction) {
      result.push(this.inlineAction);
    }

    return result;
  }

  getActionById(id: string): IAction | undefined {
    let result = super.getActionById(id);

    if (!result && this.inlineAction) {
      result = this.inlineAction.getActionById(id);
    }

    return result;
  }

  isDirty(): boolean {
    // For TextInput, empty string and undefined are considered
    // the same.
    const correctedValue = this.value !== "" ? this.value : undefined;
    const correctedOldValue =
      this._oldValue !== "" ? this._oldValue : undefined;

    return correctedValue !== correctedOldValue;
  }

  isSet(): boolean {
    return this.value ? true : false;
  }

  isValid(): boolean {
    if (!this.value) {
      return true;
    }

    if (this.regex) {
      return new RegExp(this.regex, "g").test(this.value);
    }

    return true;
  }

  get value(): string | undefined {
    return this._value;
  }
}
