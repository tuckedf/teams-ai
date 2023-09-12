import { CardElement, StringProperty, Versions } from "../core";

export abstract class Component extends CardElement {
  // #region Schema

  private static readonly nameProperty = new StringProperty(
    Versions.v1_5,
    "name"
  );

  get type(): string {
    return this.getValue(CardElement.typeNameProperty);
  }

  get name(): string {
    return this.getValue(Component.nameProperty);
  }

  // #endregion

  protected abstract getName(): string;

  constructor() {
    super();

    this.setValue(Component.nameProperty, this.getName());
  }

  getJsonTypeName(): string {
    return "Component";
  }

  getSchemaKey(): string {
    return this.getJsonTypeName() + this.getName();
  }
}
