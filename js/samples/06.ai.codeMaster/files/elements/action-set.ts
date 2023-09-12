import type {
  Action,
  IAction,
  IInput,
  IResourceInformation,
  PropertyBag,
  RenderArgs,
  SerializationContext,
  ValidationResults,
} from "../core";
import { CardElement, EnumProperty, Orientation, Versions } from "../core";
import { ActionCollection } from "../core/action-collection";

export class ActionSet extends CardElement {
  // #region Schema

  static readonly orientationProperty = new EnumProperty(
    Versions.v1_1,
    "orientation",
    Orientation
  );

  get orientation(): Orientation | undefined {
    return this.getValue(ActionSet.orientationProperty);
  }

  set orientation(value: Orientation | undefined) {
    this.setValue(ActionSet.orientationProperty, value);
  }

  // #endregion

  private _actionCollection: ActionCollection;

  protected internalParse(source: any, context: SerializationContext) {
    super.internalParse(source, context);

    this._actionCollection.parse(source["actions"], context);
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    super.internalToJSON(target, context);

    this._actionCollection.toJSON(target, "actions", context);
  }

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    return this._actionCollection.render(
      this.orientation !== undefined
        ? this.orientation
        : this.hostConfig.actions.actionsOrientation
    );
  }

  constructor() {
    super();

    this._actionCollection = new ActionCollection(this);
  }

  releaseDOMResources() {
    super.releaseDOMResources();

    this._actionCollection.releaseDOMResources();
  }

  isBleedingAtBottom(): boolean {
    if (this._actionCollection.renderedActionCount === 0) {
      return super.isBleedingAtBottom();
    } else {
      if (this._actionCollection.getActionCount() === 1) {
        return (
          this._actionCollection.expandedAction !== undefined &&
          !this.hostConfig.actions.preExpandSingleShowCardAction
        );
      } else {
        return this._actionCollection.expandedAction !== undefined;
      }
    }
  }

  getJsonTypeName(): string {
    return "ActionSet";
  }

  getActionCount(): number {
    return this._actionCollection.getActionCount();
  }

  getActionAt(index: number): Action | undefined {
    if (index >= 0 && index < this.getActionCount()) {
      return this._actionCollection.getActionAt(index);
    } else {
      return super.getActionAt(index);
    }
  }

  getActionById(id: string): IAction | undefined {
    const result: IAction | undefined =
      this._actionCollection.getActionById(id);

    return result ? result : super.getActionById(id);
  }

  getAllActions(): IAction[] {
    const result = super.getAllActions();

    for (let i = 0; i < this.getActionCount(); i++) {
      const action = this.getActionAt(i);

      if (action) {
        result.push(action);
      }
    }

    return result;
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    this._actionCollection.validateProperties(context);
  }

  addAction(action: Action) {
    this._actionCollection.addAction(action);
  }

  getAllInputs(processActions = true): IInput[] {
    return processActions ? this._actionCollection.getAllInputs() : [];
  }

  getResourceInformation(): IResourceInformation[] {
    return this._actionCollection.getResourceInformation();
  }

  get isInteractive(): boolean {
    return true;
  }
}
