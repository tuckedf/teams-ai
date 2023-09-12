import * as React from "react";
import type {
  Action,
  AllHTMLAttributes,
  BaseSerializationContext,
  CardElement,
  IAction,
  IElementSpacings,
  IResourceInformation,
  PropertyBag,
  PropertyDefinition,
  RenderArgs,
  SerializationContext,
  ValidationResults,
  Version,
} from "../core";
import {
  BoolProperty,
  ContainerStyle,
  EnumProperty,
  FillMode,
  GlobalSettings,
  HorizontalAlignment,
  Orientation,
  PaddingDefinition,
  PixelSizeProperty,
  SerializableObject,
  SerializableObjectCollectionProperty,
  SerializableObjectProperty,
  Spacing,
  StringProperty,
  Strings,
  ValidationEvent,
  ValueSetProperty,
  Versions,
  VerticalAlignment,
  createProps,
  stringToCssColor,
} from "../core";
import { ThemeName } from "../core/enums";
import { CardElementContainer } from "./card-element-container";

export class ContainerStyleProperty extends ValueSetProperty {
  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly defaultValue?: string,
    readonly onGetInitialValue?: (sender: SerializableObject) => string
  ) {
    super(
      targetVersion,
      name,
      [
        { value: ContainerStyle.Default },
        { value: ContainerStyle.Emphasis },
        { targetVersion: Versions.v1_2, value: ContainerStyle.Accent },
        { targetVersion: Versions.v1_2, value: ContainerStyle.Good },
        { targetVersion: Versions.v1_2, value: ContainerStyle.Attention },
        { targetVersion: Versions.v1_2, value: ContainerStyle.Warning },
      ],
      defaultValue,
      onGetInitialValue
    );
  }
}

export abstract class StylableCardElementContainer extends CardElementContainer {
  // #region Schema

  static readonly styleProperty = new ContainerStyleProperty(
    Versions.v1_0,
    "style"
  );

  get style(): string | undefined {
    if (this.allowCustomStyle) {
      const style = this.getValue(StylableCardElementContainer.styleProperty);

      if (style && this.hostConfig.containerStyles.getStyleByName(style)) {
        return style;
      }
    }

    return undefined;
  }

  set style(value: string | undefined) {
    this.setValue(StylableCardElementContainer.styleProperty, value);
  }

  // #endregion

  protected get allowCustomStyle(): boolean {
    return true;
  }

  protected get hasExplicitStyle(): boolean {
    return (
      this.getValue(StylableCardElementContainer.styleProperty) !== undefined
    );
  }

  protected applyBorder(_props: AllHTMLAttributes) {
    // No border in base implementation
  }

  protected applyBackground(props: AllHTMLAttributes) {
    if (this.getHasBackground()) {
      const styleDefinition = this.hostConfig.containerStyles.getStyleByName(
        this.style,
        this.hostConfig.containerStyles.getStyleByName(this.defaultStyle)
      );

      if (styleDefinition.backgroundColor) {
        const bgColor = stringToCssColor(styleDefinition.backgroundColor);

        if (bgColor) {
          props.style.backgroundColor = bgColor;
        }
      }
    }
  }

  protected getSpacings(spacings: IElementSpacings) {
    super.getSpacings(spacings);

    if (this.getEffectivePadding()) {
      spacings.padding = this.hostConfig.paddingDefinitionToSpacingDefinition(
        this.getEffectivePadding()
      );
    }

    if (this.isBleeding()) {
      // Bleed into the first parent that does have padding
      const padding = new PaddingDefinition();

      this.getImmediateSurroundingPadding(padding);

      const surroundingPadding =
        this.hostConfig.paddingDefinitionToSpacingDefinition(padding);

      spacings.margin = {
        right: -surroundingPadding.right,
        left: -surroundingPadding.left,
        top: -surroundingPadding.top,
        bottom: -surroundingPadding.bottom,
      };
    }
  }

  protected getSeparatorSpacings(spacings: IElementSpacings) {
    super.getSeparatorSpacings(spacings);

    if (this.isBleeding()) {
      // Bleed into the first parent that does have padding
      const padding = new PaddingDefinition();

      this.getImmediateSurroundingPadding(padding);

      const surroundingPadding =
        this.hostConfig.paddingDefinitionToSpacingDefinition(padding);

      if (this.separatorOrientation === Orientation.Horizontal) {
        spacings.margin.left = -surroundingPadding.left;
        spacings.margin.right = -surroundingPadding.right;
      }
    } else {
      if (this.separatorOrientation === Orientation.Horizontal) {
        spacings.margin.left = 0;
        spacings.margin.right = 0;
      }
    }
  }

  protected getHasBackground(ignoreBackgroundImages = false): boolean {
    let currentElement: CardElement | undefined = this.parent;

    while (currentElement) {
      let currentElementHasBackgroundImage = false;

      if (ignoreBackgroundImages) {
        currentElementHasBackgroundImage = false;
      } else {
        currentElementHasBackgroundImage =
          currentElement instanceof Container
            ? currentElement.backgroundImage.isValid()
            : false;
      }

      if (currentElement instanceof StylableCardElementContainer) {
        if (
          this.hasExplicitStyle &&
          (currentElement.getEffectiveStyle() !== this.getEffectiveStyle() ||
            currentElementHasBackgroundImage)
        ) {
          return true;
        }
      }

      currentElement = currentElement.parent;
    }

    return false;
  }

  protected getDefaultPadding(): PaddingDefinition {
    return this.getHasBackground() || this.getHasBorder()
      ? new PaddingDefinition(
          Spacing.Padding,
          Spacing.Padding,
          Spacing.Padding,
          Spacing.Padding
        )
      : super.getDefaultPadding();
  }

  protected abstract renderItems(): JSX.Element[];

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    // Cache hostConfig to avoid walking the parent hierarchy several times
    const hostConfig = this.hostConfig;

    const props = createProps();
    props.className = hostConfig.makeCssClassName("ac-container");
    props.style.display = "flex";
    props.style.flexDirection = "column";

    const renderedItems = this.renderItems();

    const spacings: IElementSpacings = {
      padding: {},
      margin: {},
    };

    this.getSpacings(spacings);
    props.style.paddingLeft = spacings.padding.left;
    props.style.paddingRight = spacings.padding.right;
    props.style.paddingTop = spacings.padding.top;
    props.style.paddingBottom = spacings.padding.bottom;

    props.style.marginLeft = spacings.margin.left;
    props.style.marginRight = spacings.margin.right;
    props.style.marginTop = spacings.margin.top;
    props.style.marginBottom = spacings.margin.bottom;

    this.applySelectAction(props);
    this.applyBackground(props);
    this.applyBorder(props);
    this.customizeProps(props);

    return React.createElement("div", props, renderedItems);
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    const explicitStyle = this.getValue(
      StylableCardElementContainer.styleProperty
    );

    if (explicitStyle !== undefined) {
      const styleDefinition =
        this.hostConfig.containerStyles.getStyleByName(explicitStyle);

      if (!styleDefinition) {
        context.addFailure(
          this,
          ValidationEvent.InvalidPropertyValue,
          Strings.errors.invalidPropertyValue(explicitStyle, "style")
        );
      }
    }
  }

  getEffectiveStyle(): string {
    const effectiveStyle = this.style;

    return effectiveStyle ? effectiveStyle : super.getEffectiveStyle();
  }
}

export abstract class ContainerBase extends StylableCardElementContainer {
  // #region Schema

  static readonly bleedProperty = new BoolProperty(
    Versions.v1_2,
    "bleed",
    false
  );
  static readonly minHeightProperty = new PixelSizeProperty(
    Versions.v1_2,
    "minHeight"
  );

  private get _bleed(): boolean {
    return this.getValue(ContainerBase.bleedProperty);
  }

  private set _bleed(value: boolean) {
    this.setValue(ContainerBase.bleedProperty, value);
  }

  get minPixelHeight(): number | undefined {
    return this.getValue(ContainerBase.minHeightProperty);
  }

  set minPixelHeight(value: number | undefined) {
    this.setValue(ContainerBase.minHeightProperty, value);
  }

  // #endregion

  protected adjustSize(style: React.CSSProperties) {
    super.adjustSize(style);

    if (this.minPixelHeight) {
      style.minHeight = `${this.minPixelHeight}px`;
    }
  }

  protected getHasExpandedAction(): boolean {
    return false;
  }

  protected getBleed(): boolean {
    return this._bleed;
  }

  protected setBleed(value: boolean) {
    this._bleed = value;
  }

  protected get renderedActionCount(): number {
    return 0;
  }

  isBleeding(): boolean {
    return (
      (this.getHasBackground() || this.hostConfig.alwaysAllowBleed) &&
      this.getBleed()
    );
  }
}

export class BackgroundImage extends SerializableObject {
  // #region Schema

  static readonly urlProperty = new StringProperty(Versions.v1_0, "url");
  static readonly fillModeProperty = new EnumProperty(
    Versions.v1_2,
    "fillMode",
    FillMode,
    FillMode.Cover
  );
  static readonly horizontalAlignmentProperty = new EnumProperty(
    Versions.v1_2,
    "horizontalAlignment",
    HorizontalAlignment,
    HorizontalAlignment.Left
  );
  static readonly verticalAlignmentProperty = new EnumProperty(
    Versions.v1_2,
    "verticalAlignment",
    VerticalAlignment,
    VerticalAlignment.Top
  );
  static readonly themedUrlsProperty = new SerializableObjectCollectionProperty(
    Versions.v1_5,
    "themedUrls",
    (_) => new ThemedUrl()
  );

  get url(): string | undefined {
    return this.getValue(BackgroundImage.urlProperty);
  }

  set url(value: string | undefined) {
    this.setValue(BackgroundImage.urlProperty, value);
  }

  get fillMode(): FillMode {
    return this.getValue(BackgroundImage.fillModeProperty);
  }

  set fillMode(value: FillMode) {
    this.setValue(BackgroundImage.fillModeProperty, value);
  }

  get horizontalAlignment(): HorizontalAlignment {
    return this.getValue(BackgroundImage.horizontalAlignmentProperty);
  }

  set horizontalAlignment(value: HorizontalAlignment) {
    this.setValue(BackgroundImage.horizontalAlignmentProperty, value);
  }

  get verticalAlignment(): VerticalAlignment {
    return this.getValue(BackgroundImage.verticalAlignmentProperty);
  }

  set verticalAlignment(value: VerticalAlignment) {
    this.setValue(BackgroundImage.verticalAlignmentProperty, value);
  }

  get themedUrls(): ThemedUrl[] {
    return this.getValue(BackgroundImage.themedUrlsProperty);
  }

  set themedUrls(value: ThemedUrl[]) {
    this.setValue(BackgroundImage.themedUrlsProperty, value);
  }

  // #endregion

  protected propertyChanged(property: PropertyDefinition, newValue: any): void {
    super.propertyChanged(property, newValue);

    if (property === BackgroundImage.urlProperty) {
      this.isProcessed = false;
    }
  }

  protected getSchemaKey(): string {
    return "BackgroundImage";
  }

  protected internalParse(source: any, context: BaseSerializationContext) {
    if (typeof source === "string") {
      this.resetDefaultValues();
      this.url = source;
    } else {
      return super.internalParse(source, context);
    }
  }

  isProcessed = false;

  apply(element: CardElement, props: AllHTMLAttributes) {
    let effectiveUrl = this.url;

    if (this.themedUrls) {
      for (const themedUrl of this.themedUrls) {
        if (themedUrl.url && element.theme === themedUrl.theme) {
          effectiveUrl = themedUrl.url;
          break;
        }
      }
    }

    if (this.url) {
      props.style.backgroundImage = `url('${element.preProcessPropertyValue(
        BackgroundImage.urlProperty,
        effectiveUrl
      )}')`;

      switch (this.fillMode) {
        case FillMode.Repeat:
          props.style.backgroundRepeat = "repeat";
          break;
        case FillMode.RepeatHorizontally:
          props.style.backgroundRepeat = "repeat-x";
          break;
        case FillMode.RepeatVertically:
          props.style.backgroundRepeat = "repeat-y";
          break;
        case FillMode.Cover:
        default:
          props.style.backgroundRepeat = "no-repeat";
          props.style.backgroundSize = "cover";
          break;
      }

      switch (this.horizontalAlignment) {
        case HorizontalAlignment.Left:
          break;
        case HorizontalAlignment.Center:
          props.style.backgroundPositionX = "center";
          break;
        case HorizontalAlignment.Right:
          props.style.backgroundPositionX = "right";
          break;
      }

      switch (this.verticalAlignment) {
        case VerticalAlignment.Top:
          break;
        case VerticalAlignment.Center:
          props.style.backgroundPositionY = "center";
          break;
        case VerticalAlignment.Bottom:
          props.style.backgroundPositionY = "bottom";
          break;
      }
    }
  }

  isValid(): boolean {
    if (this.url) {
      return true;
    }

    if (this.themedUrls) {
      for (const themedUrl of this.themedUrls) {
        if (themedUrl.url) {
          return true;
        }
      }
    }

    return false;
  }
}

export class ThemedUrl extends SerializableObject {
  // #region Schema

  static readonly themeProperty = new EnumProperty(
    Versions.v1_5,
    "theme",
    ThemeName,
    ThemeName.Light
  );
  static readonly urlProperty = new StringProperty(Versions.v1_5, "url");

  get theme(): ThemeName {
    return this.getValue(ThemedUrl.themeProperty);
  }

  set theme(value: ThemeName) {
    this.setValue(ThemedUrl.themeProperty, value);
  }

  get url(): string | undefined {
    return this.getValue(ThemedUrl.urlProperty);
  }

  set url(value: string | undefined) {
    this.setValue(ThemedUrl.urlProperty, value);
  }

  // #endregion

  protected getSchemaKey(): string {
    return "ThemedUrl";
  }

  constructor(theme = ThemeName.Light, url?: string) {
    super();

    this.theme = theme;
    this.url = url;
  }
}

export class Container extends ContainerBase {
  // #region Schema
  static readonly backgroundImageProperty = new SerializableObjectProperty(
    Versions.v1_0,
    "backgroundImage",
    (_) => new BackgroundImage()
  );
  static readonly verticalContentAlignmentProperty = new EnumProperty(
    Versions.v1_1,
    "verticalContentAlignment",
    VerticalAlignment
  );
  static readonly rtlProperty = new BoolProperty(Versions.v1_0, "rtl");

  get backgroundImage(): BackgroundImage {
    return this.getValue(Container.backgroundImageProperty);
  }

  get verticalContentAlignment(): VerticalAlignment | undefined {
    return this.getValue(Container.verticalContentAlignmentProperty);
  }

  set verticalContentAlignment(value: VerticalAlignment | undefined) {
    this.setValue(Container.verticalContentAlignmentProperty, value);
  }

  get rtl(): boolean | undefined {
    return this.getValue(Container.rtlProperty);
  }

  set rtl(value: boolean | undefined) {
    this.setValue(Container.rtlProperty, value);
  }

  // #endregion

  private _items: CardElement[] = [];
  private _renderedItems: CardElement[] = [];

  protected insertItemAt(
    item: CardElement,
    index: number,
    forceInsert: boolean
  ) {
    if (!item.parent || forceInsert) {
      if (item.isStandalone) {
        if (index < 0 || index >= this._items.length) {
          this._items.push(item);
        } else {
          this._items.splice(index, 0, item);
        }

        item.setParent(this);
      } else {
        throw new Error(
          Strings.errors.elementTypeNotStandalone(item.getJsonTypeName())
        );
      }
    } else {
      throw new Error(Strings.errors.elementAlreadyParented());
    }
  }

  protected getItemsCollectionPropertyName(): string {
    return "items";
  }

  protected applyBackground(props: AllHTMLAttributes) {
    if (this.backgroundImage.isValid()) {
      const backgroundImageIsBeingProcessed = this.backgroundImage.isProcessed
        ? false
        : this.processUrl({
            unprocessedUrl: this.backgroundImage.url!,
            setProcessedUrl: (processedUrl: string) => {
              this.backgroundImage.url = processedUrl;
              this.backgroundImage.isProcessed = true;

              this.updateLayout();
            },
          });

      if (!backgroundImageIsBeingProcessed) {
        /* eslint-disable-next-line prefer-spread */
        this.backgroundImage.apply(this, props);
      }
    }

    super.applyBackground(props);
  }

  protected internalRenderActions(): JSX.Element | null {
    // Container doesn't have actions
    return null;
  }

  protected renderItems(): JSX.Element[] {
    const renderedItems: JSX.Element[] = [];

    this._renderedItems = [];

    for (const item of this._items) {
      if (item.shouldRenderForTargetWidth() && this.isElementAllowed(item)) {
        const renderedItem = <item.Render key={item.key} />;

        if (renderedItem) {
          renderedItems.push(renderedItem);

          this._renderedItems.push(item);
        }
      }
    }

    const renderedActions = this.internalRenderActions();

    if (renderedActions) {
      renderedItems.push(renderedActions);
    }

    return renderedItems;
  }

  protected customizeProps(props: AllHTMLAttributes) {
    super.customizeProps(props);

    props.dir = this.rtl ? "rtl" : "ltr";

    switch (this.getEffectiveVerticalContentAlignment()) {
      case VerticalAlignment.Center:
        props.style.justifyContent = "center";
        break;
      case VerticalAlignment.Bottom:
        props.style.justifyContent = "flex-end";
        break;
      default:
        props.style.justifyContent = "flex-start";
        break;
    }
  }

  protected getHasBackground(ignoreBackgroundImages = false): boolean {
    const result = ignoreBackgroundImages
      ? false
      : this.backgroundImage.isValid();

    return result || super.getHasBackground(ignoreBackgroundImages);
  }

  protected internalParse(source: any, context: SerializationContext) {
    super.internalParse(source, context);

    this.clear();
    this.setShouldFallback(false);

    const jsonItems = source[this.getItemsCollectionPropertyName()];

    if (Array.isArray(jsonItems)) {
      for (const item of jsonItems) {
        const element = context.parseElement(
          this,
          item,
          this.forbiddenChildElements(),
          true
        );

        if (element) {
          this.insertItemAt(element, -1, true);
        }
      }
    }
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    super.internalToJSON(target, context);

    const collectionPropertyName = this.getItemsCollectionPropertyName();

    context.serializeArray(target, collectionPropertyName, this._items);
  }

  protected get isSelectable(): boolean {
    return true;
  }

  getEffectivePadding(): PaddingDefinition {
    if (
      GlobalSettings.removePaddingFromContainersWithBackgroundImage &&
      !this.getHasBackground(true)
    ) {
      return new PaddingDefinition();
    }

    const superPadding = super.getEffectivePadding();

    return superPadding;
  }

  getParentContainer(): Container | undefined {
    let currentElement = this.parent;

    while (currentElement) {
      if (currentElement instanceof Container) {
        return currentElement;
      }

      currentElement = currentElement.parent;
    }

    return undefined;
  }

  getEffectiveVerticalContentAlignment(): VerticalAlignment {
    if (this.verticalContentAlignment !== undefined) {
      return this.verticalContentAlignment;
    }

    const parentContainer = this.getParentContainer();

    return parentContainer
      ? parentContainer.getEffectiveVerticalContentAlignment()
      : VerticalAlignment.Top;
  }

  getItemCount(): number {
    return this._items.length;
  }

  getItemAt(index: number): CardElement {
    return this._items[index];
  }

  getFirstVisibleRenderedItem(): CardElement | undefined {
    if (this._renderedItems && this._renderedItems.length > 0) {
      for (const item of this._renderedItems) {
        if (item.isVisible) {
          return item;
        }
      }
    }

    return undefined;
  }

  getLastVisibleRenderedItem(): CardElement | undefined {
    if (this._renderedItems && this._renderedItems.length > 0) {
      for (let i = this._renderedItems.length - 1; i >= 0; i--) {
        if (this._renderedItems[i].isVisible) {
          return this._renderedItems[i];
        }
      }
    }

    return undefined;
  }

  getJsonTypeName(): string {
    return "Container";
  }

  isFirstElement(element: CardElement): boolean {
    for (const item of this._items) {
      if (item.isVisible) {
        return item === element;
      }
    }

    return false;
  }

  isLastElement(element: CardElement): boolean {
    for (let i = this._items.length - 1; i >= 0; i--) {
      if (this._items[i].isVisible) {
        return this._items[i] === element;
      }
    }

    return false;
  }

  isRtl(): boolean {
    if (this.rtl !== undefined) {
      return this.rtl;
    } else {
      const parentContainer = this.getParentContainer();

      return parentContainer ? parentContainer.isRtl() : false;
    }
  }

  isBleedingAtTop(): boolean {
    const firstRenderedItem = this.getFirstVisibleRenderedItem();

    return (
      this.isBleeding() ||
      (firstRenderedItem ? firstRenderedItem.isBleedingAtTop() : false)
    );
  }

  isBleedingAtBottom(): boolean {
    const lastRenderedItem = this.getLastVisibleRenderedItem();

    return (
      this.isBleeding() ||
      (lastRenderedItem
        ? lastRenderedItem.isBleedingAtBottom() &&
          lastRenderedItem.getEffectiveStyle() === this.getEffectiveStyle()
        : false)
    );
  }

  indexOf(cardElement: CardElement): number {
    return this._items.indexOf(cardElement);
  }

  addItem(item: CardElement) {
    this.insertItemAt(item, -1, false);
  }

  insertItemBefore(item: CardElement, insertBefore: CardElement) {
    this.insertItemAt(item, this._items.indexOf(insertBefore), false);
  }

  insertItemAfter(item: CardElement, insertAfter: CardElement) {
    this.insertItemAt(item, this._items.indexOf(insertAfter) + 1, false);
  }

  removeItem(item: CardElement): boolean {
    const itemIndex = this._items.indexOf(item);

    if (itemIndex >= 0) {
      this._items.splice(itemIndex, 1);

      item.setParent(undefined);

      this.updateLayout();

      return true;
    }

    return false;
  }

  clear() {
    this._items = [];
    this._renderedItems = [];
  }

  getResourceInformation(): IResourceInformation[] {
    const result = super.getResourceInformation();

    if (this.backgroundImage.isValid()) {
      result.push({
        url: this.backgroundImage.url!,
        mimeType: "image",
      });
    }

    return result;
  }

  getActionById(id: string): IAction | undefined {
    let result: IAction | undefined = super.getActionById(id);

    if (!result) {
      if (this.selectAction) {
        result = this.selectAction.getActionById(id);
      }

      if (!result) {
        for (const item of this._items) {
          if (item.shouldRenderForTargetWidth()) {
            result = item.getActionById(id);
          }

          if (result) {
            break;
          }
        }
      }
    }

    return result;
  }

  get padding(): PaddingDefinition | undefined {
    return this.getPadding();
  }

  set padding(value: PaddingDefinition | undefined) {
    this.setPadding(value);
  }

  get selectAction(): Action | undefined {
    return this._selectAction;
  }

  set selectAction(value: Action | undefined) {
    this._selectAction = value;
  }

  get bleed(): boolean {
    return this.getBleed();
  }

  set bleed(value: boolean) {
    this.setBleed(value);
  }
}
