import { ActionProperty } from "../actions/action-property";
import type {
  Action,
  AllHTMLAttributes,
  IAction,
  IElementSpacings,
  IInput,
  IResourceInformation,
  SerializableObjectSchema,
  ValidationResults,
} from "../core";
import {
  CardElement,
  SpacingDefinition,
  Strings,
  ValidationEvent,
  Versions,
  addClass,
} from "../core";

export abstract class CardElementContainer extends CardElement {
  // #region Schema

  static readonly selectActionProperty = new ActionProperty(
    Versions.v1_1,
    "selectAction",
    ["Action.ShowCard"]
  );

  protected populateSchema(schema: SerializableObjectSchema) {
    super.populateSchema(schema);

    if (!this.isSelectable) {
      schema.remove(CardElementContainer.selectActionProperty);
    }
  }

  protected get _selectAction(): Action | undefined {
    return this.getValue(CardElementContainer.selectActionProperty);
  }

  protected set _selectAction(value: Action | undefined) {
    this.setValue(CardElementContainer.selectActionProperty, value);
  }

  // #endregion

  protected isElementAllowed(element: CardElement) {
    return this.hostConfig.supportsInteractivity || !element.isInteractive;
  }

  protected getSpacings(spacings: IElementSpacings) {
    super.getSpacings(spacings);

    let physicalPadding = new SpacingDefinition();

    if (this.getEffectivePadding()) {
      physicalPadding = this.hostConfig.paddingDefinitionToSpacingDefinition(
        this.getEffectivePadding()
      );
    }

    spacings.padding = {
      top: physicalPadding.top,
      right: physicalPadding.right,
      bottom: physicalPadding.bottom,
      left: physicalPadding.left,
    };
  }

  protected applySelectAction(props: AllHTMLAttributes) {
    const hostConfig = this.hostConfig;

    if (this.allowVerticalOverflow) {
      props.style.overflowX = "hidden";
      props.style.overflowY = "auto";
    }

    if (
      this.isSelectable &&
      this._selectAction &&
      hostConfig.supportsInteractivity
    ) {
      props.style.cursor = "pointer";
      props.onClick = (e) => {
        if (this._selectAction && this._selectAction.isEffectivelyEnabled()) {
          e.preventDefault();
          e.stopPropagation();

          this._selectAction.execute();
        }
      };

      props.onKeyPress = (e) => {
        if (
          this._selectAction &&
          this._selectAction.isEffectivelyEnabled() &&
          (e.code === "Enter" || e.code === "Space")
        ) {
          // Enter or space pressed
          e.preventDefault();
          e.stopPropagation();

          this._selectAction.execute();
        }
      };

      this._selectAction.setupElementForAccessibility(props);

      if (this._selectAction.isEffectivelyEnabled()) {
        addClass(props, hostConfig.makeCssClassName("ac-selectable"));
      }
    }
  }

  protected customizeProps(_props: AllHTMLAttributes) {
    // No customization in base implementation
  }

  protected get isSelectable(): boolean {
    return false;
  }

  protected forbiddenChildElements(): string[] {
    return [];
  }

  abstract getItemCount(): number;
  abstract getItemAt(index: number): CardElement;
  abstract getFirstVisibleRenderedItem(): CardElement | undefined;
  abstract getLastVisibleRenderedItem(): CardElement | undefined;
  abstract removeItem(item: CardElement): boolean;

  allowVerticalOverflow = false;

  releaseDOMResources() {
    super.releaseDOMResources();

    for (let i = 0; i < this.getItemCount(); i++) {
      this.getItemAt(i).releaseDOMResources();
    }
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    for (let i = 0; i < this.getItemCount(); i++) {
      const item = this.getItemAt(i);

      if (!this.hostConfig.supportsInteractivity && item.isInteractive) {
        context.addFailure(
          this,
          ValidationEvent.InteractivityNotAllowed,
          Strings.errors.interactivityNotAllowed()
        );
      }

      if (!this.isElementAllowed(item)) {
        context.addFailure(
          this,
          ValidationEvent.InteractivityNotAllowed,
          Strings.errors.elementTypeNotAllowed(item.getJsonTypeName())
        );
      }

      item.internalValidateProperties(context);
    }

    if (this._selectAction) {
      this._selectAction.internalValidateProperties(context);
    }
  }

  updateLayout(processChildren = true) {
    super.updateLayout(processChildren);

    if (processChildren) {
      for (let i = 0; i < this.getItemCount(); i++) {
        this.getItemAt(i).updateLayout();
      }
    }
  }

  getAllInputs(processActions = true): IInput[] {
    const result: IInput[] = [];

    for (let i = 0; i < this.getItemCount(); i++) {
      const element = this.getItemAt(i);

      if (element.shouldRenderForTargetWidth()) {
        result.push(...element.getAllInputs(processActions));
      }
    }

    return result;
  }

  getAllActions(): IAction[] {
    const result = super.getAllActions();

    for (let i = 0; i < this.getItemCount(); i++) {
      const element = this.getItemAt(i);

      if (element.shouldRenderForTargetWidth()) {
        result.push(...element.getAllActions());
      }
    }

    if (this._selectAction) {
      result.push(this._selectAction);
    }

    return result;
  }

  getResourceInformation(): IResourceInformation[] {
    const result: IResourceInformation[] = [];

    for (let i = 0; i < this.getItemCount(); i++) {
      result.push(...this.getItemAt(i).getResourceInformation());
    }

    return result;
  }

  getElementById(id: string): CardElement | undefined {
    let result = super.getElementById(id);

    if (!result) {
      for (let i = 0; i < this.getItemCount(); i++) {
        const element = this.getItemAt(i);

        if (element.shouldRenderForTargetWidth()) {
          result = element.getElementById(id);
        }

        if (result) {
          break;
        }
      }
    }

    return result;
  }
}
