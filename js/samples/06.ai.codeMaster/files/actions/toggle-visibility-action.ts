import type {
  BaseSerializationContext,
  PropertyBag,
  PropertyDefinition,
  SerializableObject,
  ValidationResults,
} from "../core";
import {
  Action,
  CardElement,
  CustomProperty,
  parseBool,
  Strings,
  ValidationEvent,
  Versions,
} from "../core";

export class ToggleVisibilityAction extends Action {
  // #region Schema

  static readonly targetElementsProperty = new CustomProperty<PropertyBag>(
    Versions.v1_2,
    "targetElements",
    (
      _sender: SerializableObject,
      prop: PropertyDefinition,
      source: PropertyBag,
      _context: BaseSerializationContext
    ) => {
      const result: PropertyBag = {};

      if (Array.isArray(source[prop.name])) {
        for (const item of source[prop.name]) {
          if (typeof item === "string") {
            result[item] = undefined;
          } else if (typeof item === "object") {
            const elementId = item["elementId"];

            if (typeof elementId === "string") {
              result[elementId] = parseBool(item["isVisible"]);
            }
          }
        }
      }

      return result;
    },
    (
      _sender: SerializableObject,
      prop: PropertyDefinition,
      target: PropertyBag,
      value: PropertyBag,
      context: BaseSerializationContext
    ) => {
      const targetElements: any[] = [];

      for (const id of Object.keys(value)) {
        if (typeof value[id] === "boolean") {
          targetElements.push({
            elementId: id,
            isVisible: value[id],
          });
        } else {
          targetElements.push(id);
        }
      }

      context.serializeArray(target, prop.name, targetElements);
    },
    {},
    (_sender: SerializableObject) => {
      return {};
    }
  );

  get targetElements(): { [key: string]: any } {
    return this.getValue(ToggleVisibilityAction.targetElementsProperty);
  }

  set targetElements(value: { [key: string]: any }) {
    this.setValue(ToggleVisibilityAction.targetElementsProperty, value);
  }

  // #endregion

  // Note the "weird" way this field is declared is to work around a breaking
  // change introduced in TS 3.1 wrt d.ts generation. DO NOT CHANGE
  static readonly JsonTypeName: "Action.ToggleVisibility" =
    "Action.ToggleVisibility";

  protected getAriaControlsAttribute(): string | undefined {
    if (this.targetElements) {
      const elementIds = Object.keys(this.targetElements);

      if (elementIds.length > 0) {
        return elementIds.join(" ");
      }
    }

    return undefined;
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    if (!this.targetElements) {
      context.addFailure(
        this,
        ValidationEvent.PropertyCantBeNull,
        Strings.errors.propertyMustBeSet("targetElements")
      );
    }
  }

  getJsonTypeName(): string {
    return ToggleVisibilityAction.JsonTypeName;
  }

  execute() {
    super.execute();

    const rootObject = this.parent?.getRootObject();

    if (rootObject && rootObject instanceof CardElement) {
      for (const elementId of Object.keys(this.targetElements)) {
        const targetElement = rootObject.getElementById(elementId);

        if (targetElement) {
          if (typeof this.targetElements[elementId] === "boolean") {
            targetElement.isVisible = this.targetElements[elementId];
          } else {
            targetElement.isVisible = !targetElement.isVisible;
          }
        }
      }
    }
  }

  addTargetElement(
    elementId: string,
    isVisible: boolean | undefined = undefined
  ) {
    this.targetElements[elementId] = isVisible;
  }

  removeTargetElement(elementId: string) {
    delete this.targetElements[elementId];
  }
}
