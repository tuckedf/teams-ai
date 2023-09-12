import * as React from "react";
import { ActionProperty } from "../actions";
import type {
  Action,
  BaseSerializationContext,
  IInput,
  PropertyBag,
  RenderArgs,
  ValidationResults,
} from "../core";
import {
  BoolProperty,
  CardElement,
  GlobalSettings,
  StringProperty,
  Strings,
  ValidationEvent,
  Versions,
  generateUniqueId,
} from "../core";
import { AdaptiveCard, RichTextBlock, TextBlock, TextRun } from "../elements";

export abstract class Input extends CardElement implements IInput {
  // #region Schema

  static readonly labelProperty = new StringProperty(
    Versions.v1_3,
    "label",
    true
  );
  static readonly isRequiredProperty = new BoolProperty(
    Versions.v1_3,
    "isRequired",
    false
  );
  static readonly errorMessageProperty = new StringProperty(
    Versions.v1_3,
    "errorMessage",
    true
  );
  static readonly valueChangedActionProperty = new ActionProperty(
    Versions.v1_5,
    "valueChangedAction",
    [
      "Action.ToggleVisibility",
      "Action.Execute",
      "Action.Submit",
      "Action.OpenUrl",
      "Action.Overflow",
      "Action.Http",
    ]
  );

  get label(): string | undefined {
    return this.getValue(Input.labelProperty);
  }

  set label(value: string | undefined) {
    this.setValue(Input.labelProperty, value);
  }

  get isRequired(): boolean {
    return this.getValue(Input.isRequiredProperty);
  }

  set isRequired(value: boolean) {
    this.setValue(Input.isRequiredProperty, value);
  }

  get errorMessage(): string | undefined {
    return this.getValue(Input.errorMessageProperty);
  }

  set errorMessage(value: string | undefined) {
    this.setValue(Input.errorMessageProperty, value);
  }

  get valueChangedAction(): Action | undefined {
    return this.getValue(Input.valueChangedActionProperty);
  }

  set valueChangedAction(value: Action | undefined) {
    this.setValue(Input.valueChangedActionProperty, value);
  }

  // #endregion

  abstract get defaultValue(): any;

  private _hasError = false;

  protected readonly internalId = generateUniqueId();
  protected readonly labelId: string = generateUniqueId();
  protected readonly errorId: string = generateUniqueId();

  protected _oldValue: any;
  protected _value: any;

  protected internalParse(
    source: PropertyBag,
    context: BaseSerializationContext
  ) {
    super.internalParse(source, context);

    this._value = this.defaultValue;
  }

  protected getAllLabelIds(): string[] {
    const labelIds: string[] = [];

    if (this.labelledBy) {
      labelIds.push(this.labelledBy);
    }

    labelIds.push(this.labelId, this.errorId);

    return labelIds;
  }

  protected getAriaLabelledBy(): string | undefined {
    const labelIds: string[] = this.getAllLabelIds();

    return labelIds.length > 0 ? labelIds.join(" ") : undefined;
  }

  protected get isNullable(): boolean {
    return true;
  }

  protected renderLabel(): JSX.Element | null {
    const hostConfig = this.hostConfig;

    if (this.label) {
      const labelRichTextBlock = new RichTextBlock();
      labelRichTextBlock.id = this.labelId;
      labelRichTextBlock.setParent(this);
      labelRichTextBlock.forElementId = this.internalId;

      const labelInline = new TextRun(this.label);
      labelRichTextBlock.addInline(labelInline);

      if (this.isRequired) {
        labelInline.init(hostConfig.inputs.label.requiredInputs);

        const isRequiredCueInline = new TextRun(
          hostConfig.inputs.label.requiredInputs.suffix
        );
        isRequiredCueInline.color =
          hostConfig.inputs.label.requiredInputs.suffixColor;
        isRequiredCueInline.ariaHidden = true;

        labelRichTextBlock.addInline(isRequiredCueInline);
      } else {
        labelInline.init(hostConfig.inputs.label.optionalInputs);
      }

      return <labelRichTextBlock.Render />;
    }

    return null;
  }

  protected abstract renderInputControl(): JSX.Element | null;

  protected renderExtraContent(): JSX.Element | null {
    return null;
  }

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    const hostConfig = this.hostConfig;

    const style: React.CSSProperties = {
      display: "flex",
      flexDirection: "row",
      gap: "10px",
      flex: this.height === "stretch" ? "1 1 auto" : undefined,
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: `${hostConfig.getEffectiveSpacing(
            hostConfig.inputs.label.inputSpacing
          )}px`,
        }}
      >
        {this.renderLabel()}
        <div
          className={this.hostConfig.makeCssClassName("ac-input-container")}
          style={style}
        >
          {this.renderInputControl()}
          {this.renderExtraContent()}
        </div>
        {this.renderValidationError()}
      </div>
    );
  }

  protected renderValidationError(): JSX.Element | null {
    if (
      this.hasError &&
      this.errorMessage &&
      GlobalSettings.displayInputValidationErrors
    ) {
      const textBlock = new TextBlock();
      textBlock.id = this.errorId;
      textBlock.setParent(this);
      textBlock.text = this.errorMessage;
      textBlock.wrap = true;
      textBlock.init(this.hostConfig.inputs.errorMessage);

      return <textBlock.Render />;
    }

    return null;
  }

  protected executeValueChangedAction() {
    this.valueChangedAction?.execute();
  }

  protected valueChanged(newValue: any) {
    this._value = newValue;

    this.getRootElement().updateActionsEnabledState();

    this.executeValueChangedAction();

    // In valueChanged we only want to set hasError if
    // there is no error, so as to remove the validation
    // error message when necessary but not display the
    // error message when the value changes. The error
    // message should only be displayed when validateValue()
    // is called.
    const hasError = !this.isValid();

    if (!hasError) {
      this.hasError = false;
    }

    if (this.onValueChanged) {
      this.onValueChanged(this);
    }

    const card = this.getRootElement() as AdaptiveCard;

    const onInputValueChangedHandler =
      card && card.onInputValueChanged
        ? card.onInputValueChanged
        : AdaptiveCard.onInputValueChanged;

    if (onInputValueChangedHandler) {
      onInputValueChangedHandler(this);
    }
  }

  onValueChanged?: (sender: Input) => void;

  labelledBy?: string;

  abstract isSet(): boolean;

  focus(): boolean {
    return false;
  }

  resetValue(): void {
    if (this.isSet() && this._value !== this.defaultValue) {
      this.valueChanged(this.defaultValue);
      this.updateLayout();
    }
  }

  isValid(): boolean {
    return true;
  }

  isDirty(): boolean {
    return this.value !== this._oldValue;
  }

  resetDirtyState() {
    this._oldValue = this.value;
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    if (!this.id) {
      context.addFailure(
        this,
        ValidationEvent.PropertyCantBeNull,
        Strings.errors.inputsMustHaveUniqueId()
      );
    }

    if (this.isRequired) {
      if (!this.label) {
        context.addFailure(
          this,
          ValidationEvent.RequiredInputsShouldHaveLabel,
          "Required inputs should have a label"
        );
      }

      if (!this.errorMessage) {
        context.addFailure(
          this,
          ValidationEvent.RequiredInputsShouldHaveErrorMessage,
          "Required inputs should have an error message"
        );
      }
    }
  }

  validateValue(): boolean {
    const result = this.isRequired
      ? this.isSet() && this.isValid()
      : this.isValid();

    this.hasError = !result;

    return result;
  }

  getAllInputs(_processActions = true): IInput[] {
    return [this];
  }

  abstract get value(): any;

  get valueAsString(): string | undefined {
    return this.value !== undefined && this.value !== null
      ? this.value.toString()
      : undefined;
  }

  get isInteractive(): boolean {
    return true;
  }

  get hasError(): boolean {
    return this._hasError;
  }

  set hasError(value: boolean) {
    if (this._hasError !== value) {
      this._hasError = value;

      this.updateLayout();
    }
  }
}
