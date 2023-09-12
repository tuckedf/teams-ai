import * as React from "react";
import { OverflowAction } from "../actions/overflow-action";
import type {
  Action,
  CardObject,
  IAction,
  IActionCollection,
  RenderableCardObject,
  SerializationContext,
  ValidationResults,
} from "./core-objects";
import {
  ActionAlignment,
  ActionMode,
  HorizontalAlignment,
  Orientation,
  ShowCardActionMode,
  ValidationEvent,
} from "./enums";
import type { PropertyBag } from "./serialization";
import type { IInput, IResourceInformation } from "./shared";
import { ActionButtonState, GlobalSettings } from "./shared";
import { Strings } from "./strings";
import { createProps } from "./utils";

export class ActionCollection implements IActionCollection {
  private _owner: CardObject;
  private _expandedAction?: IAction;

  private renderInlineAdaptiveCard(
    inlineContent: RenderableCardObject,
    standAlone: boolean
  ): JSX.Element {
    if (standAlone) {
      return <inlineContent.Render />;
    }

    return (
      <div
        style={{
          marginTop: `${this._owner.hostConfig.actions.showCard.inlineTopMargin}px`,
        }}
        key={inlineContent.key}
      >
        <inlineContent.Render />
      </div>
    );
  }

  private updateLayout() {
    this._owner.getRootObject().updateLayout();
  }

  private collapseExpandedAction() {
    for (const action of this._renderedActions) {
      action.state = ActionButtonState.Normal;
    }

    const previouslyExpandedAction = this._expandedAction;

    this._expandedAction = undefined;

    if (previouslyExpandedAction) {
      previouslyExpandedAction.collapse();

      this.updateLayout();
    }
  }

  private shouldDisplayBuiltInOverflowActionButton(
    action: OverflowAction
  ): boolean {
    return this.onShouldDisplayBuiltInOverflowActionButton
      ? this.onShouldDisplayBuiltInOverflowActionButton(action)
      : true;
  }

  private shouldDisplayBuiltInOverflowActionMenu(
    action: OverflowAction
  ): boolean {
    return this.onShouldDisplayBuiltInOverflowActionMenu
      ? this.onShouldDisplayBuiltInOverflowActionMenu(action)
      : true;
  }

  private displayOverflowActionMenu(
    action: OverflowAction,
    target?: HTMLElement
  ) {
    if (this.onDisplayOverflowActionMenu) {
      this.onDisplayOverflowActionMenu(action, target);
    }
  }

  private _items: Action[] = [];
  private _overflowAction?: OverflowAction;
  private _renderedActions: Action[] = [];

  onShouldDisplayBuiltInOverflowActionButton?: (
    action: OverflowAction
  ) => boolean;
  onShouldDisplayBuiltInOverflowActionMenu?: (
    action: OverflowAction
  ) => boolean;
  onDisplayOverflowActionMenu?: (
    action: OverflowAction,
    target?: HTMLElement
  ) => void;

  constructor(owner: CardObject) {
    this._owner = owner;
  }

  releaseDOMResources() {
    for (const action of this._renderedActions) {
      action.releaseDOMResources();
    }
  }

  actionExecuted(action: IAction) {
    if (!action.isExpandable) {
      this.collapseExpandedAction();
    } else {
      if (action === this._expandedAction) {
        this.collapseExpandedAction();
      } else if (
        this._owner.hostConfig.actions.showCard.actionMode ===
        ShowCardActionMode.Inline
      ) {
        for (const renderedAction of this._renderedActions) {
          if (renderedAction !== action) {
            renderedAction.state = ActionButtonState.Subdued;
          } else {
            renderedAction.state = ActionButtonState.Expanded;
          }
        }

        this._expandedAction = action;

        action.expand(
          !(this._owner.isAtTheVeryLeft() && this._owner.isAtTheVeryRight()),
          true
        );
      }
    }

    this.updateLayout();
  }

  parse(source: any, context: SerializationContext) {
    this.clear();

    if (Array.isArray(source)) {
      for (const jsonAction of source) {
        const action = context.parseAction(this._owner, jsonAction, [], true);

        if (action) {
          this.addAction(action);
        }
      }
    }
  }

  toJSON(
    target: PropertyBag,
    propertyName: string,
    context: SerializationContext
  ): any {
    context.serializeArray(target, propertyName, this._items);
  }

  getActionAt(id: number): Action | undefined {
    return this._items[id];
  }

  getActionCount(): number {
    return this._items.length;
  }

  getActionById(id: string): IAction | undefined {
    let result: IAction | undefined;

    for (const item of this._items) {
      result = item.getActionById(id);

      if (result) {
        break;
      }
    }

    return result;
  }

  validateProperties(context: ValidationResults) {
    if (
      this._owner.hostConfig.actions.maxActions &&
      this._items.length > this._owner.hostConfig.actions.maxActions
    ) {
      context.addFailure(
        this._owner,
        ValidationEvent.TooManyActions,
        Strings.errors.tooManyActions(this._owner.hostConfig.actions.maxActions)
      );
    }

    if (
      this._items.length > 0 &&
      !this._owner.hostConfig.supportsInteractivity
    ) {
      context.addFailure(
        this._owner,
        ValidationEvent.InteractivityNotAllowed,
        Strings.errors.interactivityNotAllowed()
      );
    }

    for (const item of this._items) {
      item.internalValidateProperties(context);
    }
  }

  render(orientation: Orientation): JSX.Element | null {
    // Cache hostConfig for better perf
    const hostConfig = this._owner.hostConfig;

    if (!hostConfig.supportsInteractivity) {
      return null;
    }

    const maxActions = hostConfig.actions.maxActions
      ? Math.min(hostConfig.actions.maxActions, this._items.length)
      : this._items.length;

    this._renderedActions = [];

    const content: JSX.Element[] = [];

    const inlineContent =
      maxActions === 1 ? this._items[0].getInlineContent() : undefined;

    if (hostConfig.actions.preExpandSingleShowCardAction && inlineContent) {
      this._renderedActions.push(this._items[0]);

      content.push(this.renderInlineAdaptiveCard(inlineContent, true));
    } else {
      const buttonStripProps = createProps();
      buttonStripProps.className = hostConfig.makeCssClassName("ac-actionSet");
      buttonStripProps.style.display = "flex";
      buttonStripProps.style.gap = hostConfig.actions.buttonSpacing;

      if (orientation === Orientation.Horizontal) {
        buttonStripProps.style.flexDirection = "row";

        if (hostConfig.actions.allowButtonsToWrap) {
          buttonStripProps.style.flexWrap = "wrap";
        }

        if (
          this._owner.horizontalAlignment &&
          hostConfig.actions.actionAlignment !== ActionAlignment.Stretch
        ) {
          switch (this._owner.horizontalAlignment) {
            case HorizontalAlignment.Center:
              buttonStripProps.style.justifyContent = "center";
              break;
            case HorizontalAlignment.Right:
              buttonStripProps.style.justifyContent = "flex-end";
              break;
            default:
              buttonStripProps.style.justifyContent = "flex-start";
              break;
          }
        } else {
          switch (hostConfig.actions.actionAlignment) {
            case ActionAlignment.Center:
              buttonStripProps.style.justifyContent = "center";
              break;
            case ActionAlignment.Right:
              buttonStripProps.style.justifyContent = "flex-end";
              break;
            default:
              buttonStripProps.style.justifyContent = "flex-start";
              break;
          }
        }
      } else {
        buttonStripProps.style.flexDirection = "column";

        if (
          this._owner.horizontalAlignment &&
          hostConfig.actions.actionAlignment !== ActionAlignment.Stretch
        ) {
          switch (this._owner.horizontalAlignment) {
            case HorizontalAlignment.Center:
              buttonStripProps.style.alignItems = "center";
              break;
            case HorizontalAlignment.Right:
              buttonStripProps.style.alignItems = "flex-end";
              break;
            default:
              buttonStripProps.style.alignItems = "flex-start";
              break;
          }
        } else {
          switch (hostConfig.actions.actionAlignment) {
            case ActionAlignment.Center:
              buttonStripProps.style.alignItems = "center";
              break;
            case ActionAlignment.Right:
              buttonStripProps.style.alignItems = "flex-end";
              break;
            case ActionAlignment.Stretch:
              buttonStripProps.style.alignItems = "stretch";
              break;
            default:
              buttonStripProps.style.alignItems = "flex-start";
              break;
          }
        }
      }

      const primaryActions: Action[] = [];
      const secondaryActions: Action[] = [];

      this._items.forEach((action) =>
        action.mode === ActionMode.Secondary
          ? secondaryActions.push(action)
          : primaryActions.push(action)
      );

      // If primaryActions.length > maxActions, extra actions are moved to overflow
      const overflowPrimaryActions = primaryActions.splice(
        hostConfig.actions.maxActions
      );

      if (GlobalSettings.allowMoreThanMaxActionsInOverflowMenu) {
        secondaryActions.push(...overflowPrimaryActions);
      }

      let shouldRenderOverflowActionButton = true;

      if (secondaryActions.length > 0) {
        if (!this._overflowAction) {
          this._overflowAction = new OverflowAction(secondaryActions);
          this._overflowAction.onShouldDisplayBuiltInOverflowActionMenu = (
            action: OverflowAction
          ) => {
            return this.shouldDisplayBuiltInOverflowActionMenu(action);
          };
          this._overflowAction.onDisplayOverflowActionMenu = (
            action: OverflowAction,
            target?: HTMLElement
          ) => {
            this.displayOverflowActionMenu(action, target);
          };
          this._overflowAction.setParent(this._owner);
        }

        shouldRenderOverflowActionButton =
          this.shouldDisplayBuiltInOverflowActionButton(this._overflowAction);
      }

      if (this._overflowAction && shouldRenderOverflowActionButton) {
        primaryActions.push(this._overflowAction);
      }

      const renderedActions = primaryActions
        .map((action: Action) => {
          const renderedAction = <action.Render key={action.key} />;

          if (renderedAction) {
            this._renderedActions.push(action);

            return renderedAction;
          }

          return undefined;
        })
        .filter((action) => action !== undefined);

      if (renderedActions.length > 0) {
        content.push(
          <div style={{ overflow: "hidden" }} key="buttonStripContainer">
            {React.createElement("div", buttonStripProps, renderedActions)}
          </div>
        );
      }
    }

    for (const renderedAction of this._renderedActions) {
      if (renderedAction.state === ActionButtonState.Expanded) {
        const inlineContent = renderedAction.getInlineContent();

        if (inlineContent) {
          content.push(this.renderInlineAdaptiveCard(inlineContent, false));
        }

        break;
      }
    }

    return content.length > 0 ? <>{content}</> : null;
  }

  addAction(action: Action) {
    if (!action) {
      throw new Error("The action parameter cannot be null.");
    }

    if (
      (!action.parent || action.parent === this._owner) &&
      this._items.indexOf(action) < 0
    ) {
      this._items.push(action);

      action["_owner"] = this;

      if (!action.parent) {
        action.setParent(this._owner);
      }
    } else {
      throw new Error(Strings.errors.actionAlreadyParented());
    }
  }

  removeAction(action: Action): boolean {
    if (this.expandedAction && this._expandedAction === action) {
      this.collapseExpandedAction();
    }

    const actionIndex = this._items.indexOf(action);

    if (actionIndex >= 0) {
      this._items.splice(actionIndex, 1);

      action.setParent(undefined);

      for (let i = 0; i < this._renderedActions.length; i++) {
        if (this._renderedActions[i] === action) {
          this._renderedActions.splice(i, 1);

          break;
        }
      }

      return true;
    }

    return false;
  }

  clear() {
    this._items = [];
    this._renderedActions = [];
    this._expandedAction = undefined;
  }

  getAllInputs(processActions = true): IInput[] {
    const result: IInput[] = [];

    if (processActions) {
      for (const action of this._items) {
        result.push(...action.getAllInputs());
      }
    }

    return result;
  }

  getResourceInformation(): IResourceInformation[] {
    const result: IResourceInformation[] = [];

    for (const action of this._items) {
      result.push(...action.getResourceInformation());
    }

    return result;
  }

  get renderedActionCount(): number {
    return this._renderedActions.length;
  }

  get expandedAction(): IAction | undefined {
    return this._expandedAction;
  }
}
