import type { CardObject, Dictionary, IInput, PropertyBag } from "../core";
import {
  Action,
  BoolProperty,
  GlobalSettings,
  PropertyDefinition,
  Versions,
} from "../core";
import type { AssociatedInputsType } from "../core/core-objects";
import { AssociatedInputsProperty } from "../core/core-objects";

export abstract class SubmitActionBase extends Action {
  // #region Schema

  static readonly dataProperty = new PropertyDefinition(Versions.v1_0, "data");
  static readonly associatedInputsProperty = new AssociatedInputsProperty(
    Versions.v1_3,
    "associatedInputs"
  );
  static readonly disabledUnlessAssociatedInputsChangeProperty =
    new BoolProperty(
      Versions.v1_6,
      "disabledUnlessAssociatedInputsChange",
      false
    );

  private get _originalData(): PropertyBag | undefined {
    return this.getValue(SubmitActionBase.dataProperty);
  }

  private set _originalData(value: PropertyBag | undefined) {
    this.setValue(SubmitActionBase.dataProperty, value);
  }

  get associatedInputs(): AssociatedInputsType {
    return this.getValue(SubmitActionBase.associatedInputsProperty);
  }

  set associatedInputs(value: AssociatedInputsType) {
    this.setValue(SubmitActionBase.associatedInputsProperty, value);
  }

  get disabledUnlessAssociatedInputsChange(): boolean {
    return this.getValue(
      SubmitActionBase.disabledUnlessAssociatedInputsChangeProperty
    );
  }

  set disabledUnlessAssociatedInputsChange(value: boolean) {
    this.setValue(
      SubmitActionBase.disabledUnlessAssociatedInputsChangeProperty,
      value
    );
  }

  // #endregion

  private _isPrepared = false;
  private _processedData?: PropertyBag;
  private _areReferencedInputsDirty = false;

  protected internalGetReferencedInputs(): Dictionary<IInput> {
    const result: Dictionary<IInput> = {};

    if (this.associatedInputs !== "none") {
      let current: CardObject | undefined = this.parent;
      const inputs: IInput[] = [];

      while (current) {
        inputs.push(...current.getAllInputs(false));

        current = current.parent;
      }

      for (const input of inputs) {
        if (input.id) {
          result[input.id] = input;
        }
      }
    }

    return result;
  }

  protected internalPrepareForExecution(
    inputs: Dictionary<IInput> | undefined
  ) {
    if (this._originalData) {
      this._processedData = JSON.parse(JSON.stringify(this._originalData));
    } else {
      this._processedData = {};
    }

    if (this._processedData && inputs) {
      for (const key of Object.keys(inputs)) {
        const input = inputs[key];

        if (input.id && input.isSet()) {
          this._processedData[input.id] = input.valueAsString;
        }
      }
    }

    this._isPrepared = true;
  }

  protected internalAfterExecute() {
    if (GlobalSettings.resetInputsDirtyStateAfterActionExecution) {
      this.resetReferencedInputsDirtyState();
    }
  }

  resetReferencedInputsDirtyState() {
    const referencedInputs = this.getReferencedInputs();

    this._areReferencedInputsDirty = false;

    if (referencedInputs) {
      for (const key of Object.keys(referencedInputs)) {
        const input = referencedInputs[key];

        input.resetDirtyState();
      }
    }
  }

  updateEnabledState() {
    this._areReferencedInputsDirty = false;

    const referencedInputs = this.getReferencedInputs();

    if (referencedInputs) {
      for (const key of Object.keys(referencedInputs)) {
        const input = referencedInputs[key];

        if (input.isDirty()) {
          this._areReferencedInputsDirty = true;

          break;
        }
      }
    }

    this.updateLayout();
  }

  isEffectivelyEnabled(): boolean {
    const result = super.isEffectivelyEnabled();

    return this.disabledUnlessAssociatedInputsChange
      ? result && this._areReferencedInputsDirty
      : result;
  }

  get data(): object | undefined {
    return this._isPrepared ? this._processedData : this._originalData;
  }

  set data(value: object | undefined) {
    this._originalData = value;
    this._isPrepared = false;
  }
}

export class SubmitAction extends SubmitActionBase {
  // Note the "weird" way this field is declared is to work around a breaking
  // change introduced in TS 3.1 wrt d.ts generation. DO NOT CHANGE
  static readonly JsonTypeName: "Action.Submit" = "Action.Submit";

  getJsonTypeName(): string {
    return SubmitAction.JsonTypeName;
  }
}
