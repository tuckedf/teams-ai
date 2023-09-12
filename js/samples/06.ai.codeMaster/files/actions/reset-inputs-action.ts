import {
  Action,
  StringArrayProperty,
  Versions,
  CardElement,
  type Dictionary,
  type IInput,
} from "../core";

export class ResetInputsAction extends Action {
  // #region Schema

  static readonly targetInputIdsProperty = new StringArrayProperty(
    Versions.v1_5,
    "targetInputIds"
  );

  get targetInputIds(): string[] | undefined {
    return this.getValue(ResetInputsAction.targetInputIdsProperty);
  }

  set targetInputIds(value: string[] | undefined) {
    this.setValue(ResetInputsAction.targetInputIdsProperty, value);
  }
  // #endregion

  static readonly JsonTypeName: "Action.ResetInputs" = "Action.ResetInputs";

  getJsonTypeName(): string {
    return "Action.ResetInputs";
  }

  isValid(): boolean {
    return this.targetInputIds != undefined && this.targetInputIds?.length > 0;
  }

  execute(delay?: number) {
    super.execute(delay);

    if (this.isValid()) {
      const rootObject = this.parent?.getRootObject();

      if (rootObject && rootObject instanceof CardElement) {
        const allInputs = rootObject.getAllInputs();
        const allInputsMap: Dictionary<IInput> = {};

        for (const input of allInputs) {
          if (input.id) {
            allInputsMap[input.id] = input;
          }
        }

        this.targetInputIds?.forEach((targetInputId) => {
          if (allInputsMap[targetInputId]) {
            allInputsMap[targetInputId]?.resetValue();
          }
        });
      }
    }
  }
}
