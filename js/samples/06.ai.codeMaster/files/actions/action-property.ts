import type {
  Action,
  CardObject,
  PropertyBag,
  SerializableObject,
  SerializationContext,
  Version,
} from "../core";
import { PropertyDefinition } from "../core/serialization";

export class ActionProperty extends PropertyDefinition {
  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: SerializationContext
  ): Action | undefined {
    const parent = sender as CardObject;

    return context.parseAction(
      parent,
      source[this.name],
      this.forbiddenActionTypes,
      false
    );
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: Action | undefined,
    context: SerializationContext
  ) {
    context.serializeValue(
      target,
      this.name,
      value ? value.toJSON(context) : undefined,
      undefined,
      true
    );
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly forbiddenActionTypes: string[] = []
  ) {
    super(targetVersion, name, undefined);
  }
}
