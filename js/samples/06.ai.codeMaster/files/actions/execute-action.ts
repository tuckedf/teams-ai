import { StringProperty, Versions } from "../core/serialization";
import { SubmitActionBase } from "./submit-action";

export class ExecuteAction extends SubmitActionBase {
  // Note the "weird" way this field is declared is to work around a breaking
  // change introduced in TS 3.1 wrt d.ts generation. DO NOT CHANGE
  static readonly JsonTypeName: "Action.Execute" = "Action.Execute";

  // #region Schema

  static readonly verbProperty = new StringProperty(Versions.v1_4, "verb");

  get verb(): string {
    return this.getValue(ExecuteAction.verbProperty);
  }

  set verb(value: string) {
    this.setValue(ExecuteAction.verbProperty, value);
  }

  // #endregion

  getJsonTypeName(): string {
    return ExecuteAction.JsonTypeName;
  }
}
