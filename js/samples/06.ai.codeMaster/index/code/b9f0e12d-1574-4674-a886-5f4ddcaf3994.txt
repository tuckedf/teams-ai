import type { ValidationResults } from "../core";
import {
  Action,
  StringProperty,
  Strings,
  ValidationEvent,
  Versions,
} from "../core";

export class OpenUrlAction extends Action {
  // #region Schema

  static readonly urlProperty = new StringProperty(Versions.v1_0, "url");

  get url(): string | undefined {
    return this.getValue(OpenUrlAction.urlProperty);
  }

  set url(value: string | undefined) {
    this.setValue(OpenUrlAction.urlProperty, value);
  }

  // #endregion

  // Note the "weird" way this field is declared is to work around a breaking
  // change introduced in TS 3.1 wrt d.ts generation. DO NOT CHANGE
  static readonly JsonTypeName: "Action.OpenUrl" = "Action.OpenUrl";

  protected getEffectiveTooltip(): string | undefined {
    const effectiveTooltip = super.getEffectiveTooltip();

    return effectiveTooltip
      ? `${effectiveTooltip}\n${this.getHref()}`
      : this.getHref();
  }

  getJsonTypeName(): string {
    return OpenUrlAction.JsonTypeName;
  }

  getAriaRole(): string {
    return "link";
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    if (!this.url) {
      context.addFailure(
        this,
        ValidationEvent.PropertyCantBeNull,
        Strings.errors.propertyMustBeSet("url")
      );
    }
  }

  getHref(): string | undefined {
    return this.url;
  }
}
