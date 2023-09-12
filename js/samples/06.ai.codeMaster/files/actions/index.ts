import { GlobalRegistry, Versions } from "../core";
import { ExecuteAction } from "./execute-action";
import { OpenUrlAction } from "./open-url-action";
import { SubmitAction } from "./submit-action";
import { ToggleVisibilityAction } from "./toggle-visibility-action";

export { ActionProperty } from "./action-property";
export { ExecuteAction } from "./execute-action";
export { HttpAction, HttpHeader, StringWithSubstitutions } from "./http-action";
export { OpenUrlAction } from "./open-url-action";
export { SubmitAction, SubmitActionBase } from "./submit-action";
export { ToggleVisibilityAction } from "./toggle-visibility-action";
export { ResetInputsAction } from "./reset-inputs-action";

export function registerDefaultActions() {
  GlobalRegistry.defaultActions.register(
    SubmitAction.JsonTypeName,
    (_) => new SubmitAction()
  );
  GlobalRegistry.defaultActions.register(
    OpenUrlAction.JsonTypeName,
    (_) => new OpenUrlAction()
  );
  GlobalRegistry.defaultActions.register(
    ExecuteAction.JsonTypeName,
    (_) => new ExecuteAction(),
    Versions.v1_4
  );
  GlobalRegistry.defaultActions.register(
    ToggleVisibilityAction.JsonTypeName,
    (_) => new ToggleVisibilityAction(),
    Versions.v1_2
  );
}
