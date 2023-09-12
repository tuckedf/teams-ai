import * as React from "react";
import type { OverflowAction } from "../actions/overflow-action";
import type {
  Action,
  CardElement,
  IAction,
  IInput,
  IResourceInformation,
  PropertyBag,
  SerializationContext,
  ValidationResults,
} from "../core";
import { Orientation, renderSeparation } from "../core";
import { ActionCollection } from "../core/action-collection";
import { Container } from "./container";

export abstract class ContainerWithActions extends Container {
  private _actionCollection: ActionCollection;

  protected internalParse(source: any, context: SerializationContext) {
    super.internalParse(source, context);

    this.parseActions(source, context);
  }

  protected parseActions(source: any, context: SerializationContext) {
    this._actionCollection.parse(source["actions"], context);
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    super.internalToJSON(target, context);

    this._actionCollection.toJSON(target, "actions", context);
  }

  protected internalRenderActions(): JSX.Element | null {
    const renderedCollection = this._actionCollection.render(
      this.hostConfig.actions.actionsOrientation
    );

    if (renderedCollection) {
      return (
        <React.Fragment key={`actions${this.key}`}>
          {renderSeparation(
            this.hostConfig,
            {
              spacing: this.hostConfig.getEffectiveSpacing(
                this.hostConfig.actions.spacing
              ),
            },
            Orientation.Horizontal,
            { padding: {}, margin: {} }
          )}
          {renderedCollection}
        </React.Fragment>
      );
    }

    return null;
  }

  protected getHasExpandedAction(): boolean {
    if (this.renderedActionCount === 0) {
      return false;
    } else if (this.renderedActionCount === 1) {
      return (
        this._actionCollection.expandedAction !== undefined &&
        !this.hostConfig.actions.preExpandSingleShowCardAction
      );
    } else {
      return this._actionCollection.expandedAction !== undefined;
    }
  }

  protected get renderedActionCount(): number {
    return this._actionCollection.renderedActionCount;
  }

  protected get renderIfEmpty(): boolean {
    return false;
  }

  protected abstract shouldDisplayBuiltInOverflowActionMenu(
    action: OverflowAction
  ): boolean;
  protected abstract shouldDisplayBuiltInOverflowActionButton(
    action: OverflowAction
  ): boolean;
  protected abstract displayOverflowActionMenu(
    action: OverflowAction,
    target?: HTMLElement
  ): void;

  constructor() {
    super();

    this._actionCollection = new ActionCollection(this);
    this._actionCollection.onShouldDisplayBuiltInOverflowActionButton = (
      action: OverflowAction
    ) => {
      return this.shouldDisplayBuiltInOverflowActionButton(action);
    };
    this._actionCollection.onShouldDisplayBuiltInOverflowActionMenu = (
      action: OverflowAction
    ) => {
      return this.shouldDisplayBuiltInOverflowActionMenu(action);
    };
    this._actionCollection.onDisplayOverflowActionMenu = (
      action: OverflowAction,
      target?: HTMLElement
    ) => {
      this.displayOverflowActionMenu(action, target);
    };
  }

  releaseDOMResources() {
    super.releaseDOMResources();

    this._actionCollection.releaseDOMResources();
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

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    if (this._actionCollection) {
      this._actionCollection.validateProperties(context);
    }
  }

  isLastElement(element: CardElement): boolean {
    return (
      super.isLastElement(element) &&
      this._actionCollection.getActionCount() === 0
    );
  }

  addAction(action: Action) {
    this._actionCollection.addAction(action);
  }

  clear() {
    super.clear();

    this._actionCollection.clear();
  }

  getAllInputs(processActions = true): IInput[] {
    const result = super.getAllInputs(processActions);

    if (processActions) {
      result.push(...this._actionCollection.getAllInputs(processActions));
    }

    return result;
  }

  getResourceInformation(): IResourceInformation[] {
    const result = super.getResourceInformation();

    result.push(...this._actionCollection.getResourceInformation());

    return result;
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

  get isStandalone(): boolean {
    return false;
  }
}
