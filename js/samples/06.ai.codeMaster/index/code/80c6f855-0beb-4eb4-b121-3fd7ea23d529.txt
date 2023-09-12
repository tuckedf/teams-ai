import type {
  AllHTMLAttributes,
  CardObject,
  IAction,
  IElementSpacings,
  IInput,
  IResourceInformation,
  PropertyBag,
  RenderableCardObject,
  SerializableObjectSchema,
  SerializationContext,
  ValidationResults,
} from "../core";
import {
  Action,
  ContainerStyle,
  PaddingDefinition,
  ShowCardActionMode,
  Spacing,
  Strings,
  ValidationEvent,
} from "../core";
import { AdaptiveCard } from "./adaptive-card";

class InlineAdaptiveCard extends AdaptiveCard {
  // #region Schema

  protected getSchemaKey(): string {
    return "InlineAdaptiveCard";
  }

  protected populateSchema(schema: SerializableObjectSchema) {
    super.populateSchema(schema);

    schema.remove(AdaptiveCard.$schemaProperty, AdaptiveCard.versionProperty);
  }

  // #endregion

  protected getDefaultPadding(): PaddingDefinition {
    const spacing = this.suppressStyle ? Spacing.None : Spacing.Padding;

    const result = new PaddingDefinition(spacing, spacing, spacing, spacing);

    return result;
  }

  protected getSpacings(spacings: IElementSpacings) {
    super.getSpacings(spacings);

    if (!this.suppressStyle) {
      const padding = this.getEffectivePadding();

      this.getImmediateSurroundingPadding(padding);

      const physicalPadding =
        this.hostConfig.paddingDefinitionToSpacingDefinition(padding);

      spacings.padding.left = physicalPadding.left;
      spacings.padding.right = physicalPadding.right;

      spacings.margin.left = -physicalPadding.left;
      spacings.margin.right = -physicalPadding.right;

      if (physicalPadding.bottom !== 0) {
        spacings.padding.bottom = physicalPadding.bottom;
        spacings.margin.bottom = -physicalPadding.bottom;
      }
    }
  }

  protected customizeProps(props: AllHTMLAttributes) {
    super.customizeProps(props);

    props["aria-live"] = "polite";
    props.tabIndex = undefined;
  }

  protected get bypassVersionCheck(): boolean {
    return true;
  }

  protected get defaultStyle(): string {
    if (this.suppressStyle) {
      return ContainerStyle.Default;
    } else {
      return this.hostConfig.actions.showCard.style
        ? this.hostConfig.actions.showCard.style
        : ContainerStyle.Emphasis;
    }
  }

  suppressStyle = false;

  get hasVisibleSeparator(): boolean {
    return false;
  }
}

export class ShowCardAction extends Action {
  // Note the "weird" way this field is declared is to work around a breaking
  // change introduced in TS 3.1 wrt d.ts generation. DO NOT CHANGE
  static readonly JsonTypeName: "Action.ShowCard" = "Action.ShowCard";

  private inlineCardExpanded(isExpanded: boolean) {
    const card = this.parent?.getRootObject();

    const handler =
      card instanceof AdaptiveCard && card.onInlineCardExpanded
        ? card.onInlineCardExpanded
        : AdaptiveCard.onInlineCardExpanded;

    if (handler) {
      handler(this, isExpanded);
    }
  }

  protected internalParse(source: any, context: SerializationContext) {
    super.internalParse(source, context);

    const jsonCard = source["card"];

    if (jsonCard) {
      this.card.parse(jsonCard, context);
    } else {
      context.logParseEvent(
        this,
        ValidationEvent.PropertyCantBeNull,
        Strings.errors.showCardMustHaveCard()
      );
    }
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    super.internalToJSON(target, context);

    if (this.card) {
      context.serializeValue(target, "card", this.card.toJSON(context));
    }
  }

  readonly card: AdaptiveCard = new InlineAdaptiveCard();

  expand(suppressStyle = false, raiseEvent = false) {
    (this.card as InlineAdaptiveCard).suppressStyle = suppressStyle;

    if (raiseEvent) {
      this.inlineCardExpanded(true);
    }
  }

  collapse() {
    this.inlineCardExpanded(false);
  }

  releaseDOMResources() {
    super.releaseDOMResources();

    this.card.releaseDOMResources();
  }

  getJsonTypeName(): string {
    return ShowCardAction.JsonTypeName;
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    this.card.internalValidateProperties(context);
  }

  setParent(value: CardObject) {
    super.setParent(value);

    this.card.setParent(value);
  }

  getAllInputs(processActions = true): IInput[] {
    return this.card.getAllInputs(processActions);
  }

  getAllActions(): IAction[] {
    const result = super.getAllActions();

    result.push(...this.card.getAllActions());

    return result;
  }

  getResourceInformation(): IResourceInformation[] {
    const result = super.getResourceInformation();

    result.push(...this.card.getResourceInformation());

    return result;
  }

  getInlineContent(): RenderableCardObject | undefined {
    return this.card;
  }

  getActionById(id: string): IAction | undefined {
    let result = super.getActionById(id);

    if (!result) {
      result = this.card.getActionById(id);
    }

    return result;
  }

  shouldRaiseOnExecuteEvent(): boolean {
    return (
      this.hostConfig.actions.showCard.actionMode === ShowCardActionMode.Popup
    );
  }

  get isExpandable(): boolean {
    return true;
  }
}
