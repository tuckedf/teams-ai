/* eslint-disable */
import * as React from "react";
import { defaultAnchorRenderer } from "./anchor-renderer";
import {
  ActionAlignment,
  ActionIconPlacement,
  ActionMode,
  ActionStyle,
  ContainerStyle,
  HorizontalAlignment,
  Orientation,
  Spacing,
  ThemeName,
  TypeErrorType,
  ValidationEvent,
  ValidationPhase,
} from "./enums";
import { HostCapabilities } from "./host-capabilities";
import type {
  ContainerStyleDefinition,
  HostConfig,
  TextStyleDefinition,
} from "./host-config";
import { defaultHostConfig } from "./host-config";
import { defaultImageRenderer } from "./image-renderer";
import type {
  IValidationEvent,
  PropertyBag,
  SerializableObject,
  Version,
} from "./serialization";
import {
  BaseSerializationContext,
  BoolProperty,
  CustomProperty,
  EnumProperty,
  PropertyDefinition,
  SerializableObjectProperty,
  StringProperty,
  TypedSerializableObject,
  ValueSetProperty,
  Versions,
} from "./serialization";
import type {
  Dictionary,
  HostWidth,
  IDataQueryRequest,
  IElementSpacings,
  IImage,
  IInput,
  ILocalizableString,
  IProcessableUrl,
  IResourceInformation,
  ISeparationDefinition,
  ImgHTMLAttributes,
  RenderArgs,
} from "./shared";
import {
  ActionButtonState,
  GlobalSettings,
  PaddingDefinition,
  TargetWidth,
} from "./shared";
import { Strings } from "./strings";
import { addClass, createProps, parseString, stringToCssColor } from "./utils";

export class ValidationResults {
  readonly allIds: Dictionary<number> = {};
  readonly validationEvents: IValidationEvent[] = [];

  addFailure(cardObject: CardObject, event: ValidationEvent, message: string) {
    this.validationEvents.push({
      phase: ValidationPhase.Validation,
      source: cardObject,
      event,
      message,
    });
  }
}

export interface IAction {
  readonly id?: string;
  readonly title?: string;
  readonly iconUrl?: string;
  readonly style: ActionStyle;
  readonly mode: ActionMode;
  readonly tooltip?: string;
  readonly isEnabled: boolean;
  readonly isExpandable: boolean;
  readonly isExpanded: boolean;
  readonly isInSubCard: boolean;
  readonly hostConfig: HostConfig;
  execute(): void;
  expand(suppressStyle: boolean, raiseEvent: boolean): void;
  collapse(): void;
  getInlineContent(): RenderableCardObject | undefined;
  updateEnabledState(): void;
  toJSON(context: any): void;
  isEffectivelyEnabled(): boolean;
  focus(): boolean;
}

export interface IActionCollection {
  actionExecuted(action: IAction): void;
}

export type CardObjectType = { new (): CardObject };

export abstract class CardObject extends TypedSerializableObject {
  // #region Schema

  static readonly idProperty = new StringProperty(Versions.v1_0, "id");
  static readonly requiresProperty = new SerializableObjectProperty(
    Versions.v1_2,
    "requires",
    (_) => new HostCapabilities(),
    false,
    new HostCapabilities()
  );

  get id(): string | undefined {
    return this.getValue(CardObject.idProperty);
  }

  set id(value: string | undefined) {
    this.setValue(CardObject.idProperty, value);
  }

  get requires(): HostCapabilities {
    return this.getValue(CardObject.requiresProperty);
  }

  // #endregion

  private _shouldFallback = false;

  protected _parent?: CardObject;

  protected actionExecuted(_action: IAction) {
    // Do nothing in base implementation
  }

  protected getDefaultSerializationContext(): BaseSerializationContext {
    return new SerializationContext();
  }

  onPreProcessPropertyValue?: (
    sender: CardObject,
    property: PropertyDefinition,
    value: any
  ) => any;

  onLocalizeString?: (key: string) => string | undefined;

  abstract get hostConfig(): HostConfig;
  abstract get theme(): ThemeName;

  localizeString(s: ILocalizableString): string {
    let localizedString: string | undefined;

    if (this.onLocalizeString) {
      localizedString = this.onLocalizeString(s.key);
    } else if (this.parent) {
      localizedString = this.parent.localizeString(s);
    }

    return localizedString === undefined ? s.defaultValue : localizedString;
  }

  getAllInputs(_processActions = true): IInput[] {
    return [];
  }

  preProcessPropertyValue(prop: PropertyDefinition, propertyValue?: any): any {
    const value =
      propertyValue === undefined ? this.getValue(prop) : propertyValue;

    if (GlobalSettings.allowPreProcessingPropertyValues) {
      /* eslint-disable-next-line @typescript-eslint/no-this-alias */
      let currentObject: CardObject | undefined = this;

      while (currentObject && !currentObject.onPreProcessPropertyValue) {
        currentObject = currentObject.parent;
      }

      if (currentObject && currentObject.onPreProcessPropertyValue) {
        return currentObject.onPreProcessPropertyValue(this, prop, value);
      }
    }

    return value;
  }

  setParent(value: CardObject | undefined) {
    this._parent = value;
  }

  setShouldFallback(value: boolean) {
    this._shouldFallback = value;
  }

  shouldFallback(): boolean {
    return (
      this._shouldFallback ||
      !this.requires.areAllMet(this.hostConfig.hostCapabilities)
    );
  }

  getRootObject(): CardObject {
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    let currentObject: CardObject = this;

    while (currentObject.parent) {
      currentObject = currentObject.parent;
    }

    return currentObject;
  }

  internalValidateProperties(context: ValidationResults) {
    if (this.id) {
      if (context.allIds.hasOwnProperty(this.id)) {
        if (context.allIds[this.id] === 1) {
          context.addFailure(
            this,
            ValidationEvent.DuplicateId,
            Strings.errors.duplicateId(this.id)
          );
        }

        context.allIds[this.id] += 1;
      } else {
        context.allIds[this.id] = 1;
      }
    }
  }

  isAtTheVeryLeft(): boolean {
    return false;
  }

  isAtTheVeryRight(): boolean {
    return false;
  }

  isAtTheVeryTop(): boolean {
    return false;
  }

  isAtTheVeryBottom(): boolean {
    return false;
  }

  validateProperties(): ValidationResults {
    const result = new ValidationResults();

    this.internalValidateProperties(result);

    return result;
  }

  releaseDOMResources() {
    // Do nothing in base implementation
  }

  updateActionsEnabledState() {
    // Do nothing in base implementation
  }

  updateLayout(_processChildren = false) {
    // Do nothing in base implementation
  }

  renderAnchor(
    displayText: string | undefined,
    props: React.AnchorHTMLAttributes<HTMLAnchorElement>
  ): JSX.Element | null {
    return this.parent
      ? this.parent.renderAnchor(displayText, props)
      : defaultAnchorRenderer(displayText, props);
  }

  renderImage(
    image: IImage,
    props: React.ImgHTMLAttributes<HTMLImageElement>
  ): JSX.Element | null {
    return this.parent
      ? this.parent.renderImage(image, props)
      : defaultImageRenderer(image, props);
  }

  processUrl(url: IProcessableUrl): boolean {
    return this.parent ? this.parent.processUrl(url) : false;
  }

  dataQuery(request: IDataQueryRequest): boolean {
    return this.parent ? this.parent.dataQuery(request) : false;
  }

  abstract get isEnabled(): boolean;

  get isInSubCard(): boolean {
    return this.parent ? this.parent.isInSubCard : false;
  }

  get horizontalAlignment(): HorizontalAlignment | undefined {
    return undefined;
  }

  get parent(): CardObject | undefined {
    return this._parent;
  }
}

export abstract class RenderableCardObject extends CardObject {
  protected abstract render(args?: RenderArgs): JSX.Element | null;

  private _state?: [number, React.Dispatch<React.SetStateAction<number>>];

  private invalidate() {
    if (this._state) {
      this._state[1]((renderCount) => renderCount + 1);
    }
  }

  protected afterParse() {
    super.afterParse();

    this.invalidate();
  }

  protected propertyChanged(property: PropertyDefinition, newValue: any) {
    super.propertyChanged(property, newValue);

    this.invalidate();
  }

  updateLayout(processChildren = true) {
    super.updateLayout(processChildren);

    this.invalidate();
  }

  Render = (props: { args?: RenderArgs }): JSX.Element | null => {
    this._state = React.useState(0);

    React.useEffect(() => {
      return () => {
        this._state = undefined;
      };
    }, []);

    return this.render(props.args);
  };

  get hasBeenRendered(): boolean {
    return this._state !== undefined;
  }
}

export function renderSeparation(
  hostConfig: HostConfig,
  separationDefinition: ISeparationDefinition,
  orientation: Orientation,
  spacings: IElementSpacings
): JSX.Element | null {
  if (
    separationDefinition.spacing > 0 ||
    (separationDefinition.lineThickness &&
      separationDefinition.lineThickness > 0)
  ) {
    const props = createProps();
    props.className = hostConfig.makeCssClassName(
      `ac-${
        orientation === Orientation.Horizontal ? "horizontal" : "vertical"
      }-separator`
    );
    props["aria-hidden"] = true;
    props.style.overflow = "hidden";
    props.style.flex = "0 0 auto";

    const color = separationDefinition.lineColor
      ? stringToCssColor(separationDefinition.lineColor)
      : "";

    if (orientation === Orientation.Horizontal) {
      if (separationDefinition.lineThickness) {
        props.style.paddingTop = `${separationDefinition.spacing / 2}px`;
        props.style.marginBottom = `${separationDefinition.spacing / 2}px`;
        props.style.borderBottom = `${separationDefinition.lineThickness}px solid ${color}`;
      } else {
        props.style.height = `${separationDefinition.spacing}px`;
      }

      props.style.marginLeft = spacings.margin.left;
      props.style.marginRight = spacings.margin.right;
    } else {
      if (separationDefinition.lineThickness) {
        props.style.paddingLeft = `${separationDefinition.spacing / 2}px`;
        props.style.marginRight = `${separationDefinition.spacing / 2}px`;
        props.style.borderRight = `${separationDefinition.lineThickness}px solid ${color}`;
      } else {
        props.style.width = `${separationDefinition.spacing}px`;
      }
    }

    return React.createElement("div", props);
  }

  return null;
}

export type CardElementHeight = "auto" | "stretch";

export abstract class CardElement extends RenderableCardObject {
  // #region Schema

  static readonly langProperty = new StringProperty(
    Versions.v1_1,
    "lang",
    true,
    /^[a-z]{2,3}$/gi
  );
  static readonly isVisibleProperty = new BoolProperty(
    Versions.v1_2,
    "isVisible",
    true
  );
  static readonly separatorProperty = new BoolProperty(
    Versions.v1_0,
    "separator",
    false
  );
  static readonly heightProperty = new ValueSetProperty(
    Versions.v1_1,
    "height",
    [{ value: "auto" }, { value: "stretch" }],
    "auto"
  );
  static readonly horizontalAlignmentProperty = new EnumProperty(
    Versions.v1_0,
    "horizontalAlignment",
    HorizontalAlignment
  );
  static readonly spacingProperty = new EnumProperty(
    Versions.v1_0,
    "spacing",
    Spacing,
    Spacing.Default
  );

  static readonly targetWidthProperty = new CustomProperty<
    TargetWidth | undefined
  >(
    Versions.v1_0,
    "targetWidth",
    (
      _sender: SerializableObject,
      prop: PropertyDefinition,
      source: PropertyBag,
      _context: BaseSerializationContext
    ) => {
      const value = source[prop.name];

      const result: TargetWidth | undefined =
        typeof value === "string"
          ? TargetWidth.parse(value)
          : prop.defaultValue;

      return result;
    },
    (
      _sender: SerializableObject,
      _property: PropertyDefinition,
      target: PropertyBag,
      value: TargetWidth | undefined,
      context: BaseSerializationContext
    ) => {
      if (value) {
        context.serializeValue(target, "targetWidth", value.toString());
      }
    }
  );

  get horizontalAlignment(): HorizontalAlignment | undefined {
    return this.getValue(CardElement.horizontalAlignmentProperty);
  }

  set horizontalAlignment(value: HorizontalAlignment | undefined) {
    this.setValue(CardElement.horizontalAlignmentProperty, value);
  }

  get spacing(): Spacing {
    return this.getValue(CardElement.spacingProperty);
  }

  set spacing(value: Spacing) {
    this.setValue(CardElement.spacingProperty, value);
  }

  get separator(): boolean {
    return this.getValue(CardElement.separatorProperty);
  }

  set separator(value: boolean) {
    this.setValue(CardElement.separatorProperty, value);
  }

  get height(): CardElementHeight {
    return this.getValue(CardElement.heightProperty);
  }

  set height(value: CardElementHeight) {
    this.setValue(CardElement.heightProperty, value);
  }

  get lang(): string | undefined {
    const lang = this.getValue(CardElement.langProperty);

    if (lang) {
      return lang;
    } else {
      if (this.parent) {
        return this.parent.lang;
      } else {
        return undefined;
      }
    }
  }

  set lang(value: string | undefined) {
    this.setValue(CardElement.langProperty, value);
  }

  get isVisible(): boolean {
    return this.getValue(CardElement.isVisibleProperty);
  }

  set isVisible(value: boolean) {
    if (this.isVisible !== value) {
      this.setValue(CardElement.isVisibleProperty, value);

      this.getRootElement().updateLayout();

      this.elementVisibilityChanged(this);
    }
  }

  get targetWidth(): TargetWidth | undefined {
    return this.getValue(CardElement.targetWidthProperty);
  }

  set targetWidth(value: TargetWidth | undefined) {
    this.setValue(CardElement.targetWidthProperty, value);
  }

  // #endregion

  private _isEnabled?: boolean;
  private _hostConfig?: HostConfig;
  private _theme?: ThemeName;
  private _padding?: PaddingDefinition;
  private _hostWidth?: HostWidth;

  protected abstract internalRender(args?: RenderArgs): JSX.Element | null;

  protected render(args?: RenderArgs): JSX.Element {
    const renderedElement = this.isVisible ? this.internalRender(args) : null;

    let renderedSeparator: JSX.Element | null = null;

    if (renderedElement && this.hasVisibleSeparator) {
      const spacings: IElementSpacings = { padding: {}, margin: {} };

      this.getSeparatorSpacings(spacings);

      renderedSeparator = renderSeparation(
        this.hostConfig,
        {
          spacing: this.hostConfig.getEffectiveSpacing(this.spacing),
          lineThickness: this.separator
            ? this.hostConfig.separator.lineThickness
            : undefined,
          lineColor: this.separator
            ? this.hostConfig.separator.lineColor
            : undefined,
        },
        this.separatorOrientation,
        spacings
      );
    }

    if (renderedElement && renderedElement.props.style) {
      this.adjustSize(renderedElement.props.style);
    }

    return (
      <>
        {renderedSeparator}
        {renderedElement}
      </>
    );
  }

  protected getDefaultSerializationContext(): BaseSerializationContext {
    return new SerializationContext();
  }

  protected elementVisibilityChanged(element: CardElement) {
    this.getRootElement().elementVisibilityChanged(element);
  }

  protected adjustSize(style: React.CSSProperties) {
    if (this.height === "auto") {
      style.flex = "0 0 auto";
    } else {
      style.flex = "1 1 auto";
    }
  }

  protected getSpacings(_spacings: IElementSpacings) {
    // Do nothing in base implementation
  }

  protected getSeparatorSpacings(spacings: IElementSpacings) {
    if (this.separatorOrientation === Orientation.Horizontal) {
      if (GlobalSettings.alwaysBleedSeparators && !this.isBleeding()) {
        const padding = new PaddingDefinition();

        this.getImmediateSurroundingPadding(padding);

        const physicalPadding =
          this.hostConfig.paddingDefinitionToSpacingDefinition(padding);

        spacings.margin.left = -physicalPadding.left;
        spacings.margin.right = -physicalPadding.right;
      } else {
        spacings.margin.right = 0;
        spacings.margin.left = 0;
      }
    }
  }

  protected getDefaultPadding(): PaddingDefinition {
    return new PaddingDefinition();
  }

  protected getHasBackground(_ignoreBackgroundImages = false): boolean {
    return false;
  }

  protected getHasBorder(): boolean {
    return false;
  }

  protected getPadding(): PaddingDefinition | undefined {
    return this._padding;
  }

  protected setPadding(value: PaddingDefinition | undefined) {
    this._padding = value;
  }

  protected shouldSerialize(context: SerializationContext): boolean {
    return (
      context.elementRegistry.findByName(this.getJsonTypeName()) !== undefined
    );
  }

  protected get useDefaultSizing(): boolean {
    return true;
  }

  protected get separatorOrientation(): Orientation {
    return Orientation.Horizontal;
  }

  protected get defaultStyle(): string {
    return ContainerStyle.Default;
  }

  customCssSelector?: string;

  asString(): string | undefined {
    return "";
  }

  isBleeding(): boolean {
    return false;
  }

  getEffectiveStyle(): string {
    if (this.parent) {
      return this.parent.getEffectiveStyle();
    }

    return this.defaultStyle;
  }

  getEffectiveStyleDefinition(): ContainerStyleDefinition {
    return this.hostConfig.containerStyles.getStyleByName(
      this.getEffectiveStyle()
    );
  }

  getEffectiveTextStyleDefinition(): TextStyleDefinition {
    if (this.parent) {
      return this.parent.getEffectiveTextStyleDefinition();
    }

    return this.hostConfig.textStyles.default;
  }

  getImmediateSurroundingPadding(
    result: PaddingDefinition,
    processTop = true,
    processRight = true,
    processBottom = true,
    processLeft = true
  ) {
    if (this.parent) {
      let doProcessTop = processTop && this.parent.isTopElement(this);
      let doProcessRight = processRight && this.parent.isRightMostElement(this);
      let doProcessBottom = processBottom && this.parent.isBottomElement(this);
      let doProcessLeft = processLeft && this.parent.isLeftMostElement(this);

      const effectivePadding = this.parent.getEffectivePadding();

      if (effectivePadding) {
        if (doProcessTop && effectivePadding.top !== Spacing.None) {
          result.top = effectivePadding.top;

          doProcessTop = false;
        }

        if (doProcessRight && effectivePadding.right !== Spacing.None) {
          result.right = effectivePadding.right;

          doProcessRight = false;
        }

        if (doProcessBottom && effectivePadding.bottom !== Spacing.None) {
          result.bottom = effectivePadding.bottom;

          doProcessBottom = false;
        }

        if (doProcessLeft && effectivePadding.left !== Spacing.None) {
          result.left = effectivePadding.left;

          doProcessLeft = false;
        }
      }

      if (doProcessTop || doProcessRight || doProcessBottom || doProcessLeft) {
        this.parent.getImmediateSurroundingPadding(
          result,
          doProcessTop,
          doProcessRight,
          doProcessBottom,
          doProcessLeft
        );
      }
    }
  }

  getActionCount(): number {
    return 0;
  }

  getActionAt(index: number): Action | undefined {
    throw new Error(Strings.errors.indexOutOfRange(index));
  }

  indexOfAction(action: Action): number {
    for (let i = 0; i < this.getActionCount(); i++) {
      if (this.getActionAt(i) === action) {
        return i;
      }
    }

    return -1;
  }

  updateActionsEnabledState() {
    const allActions = this.getRootElement().getAllActions();

    for (const action of allActions) {
      action.updateEnabledState();
    }
  }

  indexOf(_cardElement: CardElement): number {
    return -1;
  }

  isFirstElement(_element: CardElement): boolean {
    return true;
  }

  isLastElement(_element: CardElement): boolean {
    return true;
  }

  isAtTheVeryLeft(): boolean {
    return this.parent
      ? this.parent.isLeftMostElement(this) && this.parent.isAtTheVeryLeft()
      : true;
  }

  isAtTheVeryRight(): boolean {
    return this.parent
      ? this.parent.isRightMostElement(this) && this.parent.isAtTheVeryRight()
      : true;
  }

  isAtTheVeryTop(): boolean {
    return this.parent
      ? this.parent.isFirstElement(this) && this.parent.isAtTheVeryTop()
      : true;
  }

  isAtTheVeryBottom(): boolean {
    return this.parent
      ? this.parent.isLastElement(this) && this.parent.isAtTheVeryBottom()
      : true;
  }

  isBleedingAtTop(): boolean {
    return false;
  }

  isBleedingAtBottom(): boolean {
    return false;
  }

  isLeftMostElement(_element: CardElement): boolean {
    return true;
  }

  isRightMostElement(_element: CardElement): boolean {
    return true;
  }

  isTopElement(element: CardElement): boolean {
    return this.isFirstElement(element);
  }

  isBottomElement(element: CardElement): boolean {
    return this.isLastElement(element);
  }

  getRootElement(): CardElement {
    return this.getRootObject() as CardElement;
  }

  getAllActions(): IAction[] {
    const result: IAction[] = [];

    for (let i = 0; i < this.getActionCount(); i++) {
      const action = this.getActionAt(i);

      if (action) {
        result.push(action);
      }
    }

    return result;
  }

  getResourceInformation(): IResourceInformation[] {
    return [];
  }

  getElementById(id: string): CardElement | undefined {
    return this.id === id ? this : undefined;
  }

  getActionById(_id: string): IAction | undefined {
    return undefined;
  }

  getEffectivePadding(): PaddingDefinition {
    const padding = this.getPadding();

    const result = padding ? padding : this.getDefaultPadding();

    return result;
  }

  getEffectiveHorizontalAlignment(): HorizontalAlignment {
    if (this.horizontalAlignment !== undefined) {
      return this.horizontalAlignment;
    }

    if (this.parent) {
      return this.parent.getEffectiveHorizontalAlignment();
    }

    return HorizontalAlignment.Left;
  }

  focusFirstFocusableElement(): boolean {
    const allInputs = this.getAllInputs(true);

    for (const input of allInputs) {
      if (input.focus()) {
        return true;
      }
    }

    const allActions = this.getAllActions();

    for (const action of allActions) {
      if (action.focus()) {
        return true;
      }

      return false;
    }

    return false;
  }

  shouldRenderForTargetWidth(hostWidth?: HostWidth): boolean {
    const effectiveHostWidth = hostWidth ?? this.hostWidth;

    if (!this.targetWidth) {
      return true;
    }

    return this.targetWidth.matches(effectiveHostWidth);
  }

  get hostWidth(): HostWidth {
    if (this._hostWidth) {
      return this._hostWidth;
    } else {
      if (this.parent) {
        return this.parent.hostWidth;
      } else {
        return "wide";
      }
    }
  }

  set hostWidth(value: HostWidth | undefined) {
    this._hostWidth = value;
  }

  get hostConfig(): HostConfig {
    if (this._hostConfig) {
      return this._hostConfig;
    } else {
      if (this.parent) {
        return this.parent.hostConfig;
      } else {
        return defaultHostConfig;
      }
    }
  }

  set hostConfig(value: HostConfig | undefined) {
    this._hostConfig = value;
  }

  get theme(): ThemeName {
    if (this._theme) {
      return this._theme;
    } else {
      if (this.parent) {
        return this.parent.theme;
      } else {
        return ThemeName.Light;
      }
    }
  }

  set theme(value: ThemeName) {
    this._theme = value;
  }

  get index(): number {
    if (this.parent) {
      return this.parent.indexOf(this);
    } else {
      return 0;
    }
  }

  get isEnabled(): boolean {
    if (this._isEnabled !== undefined) {
      return this._isEnabled;
    }

    if (this.parent) {
      return this.parent.isEnabled;
    }

    return true;
  }

  set isEnabled(value: boolean | undefined) {
    // For now, setting isEnabled will purposefully not
    // cause React to re-render. Host applications will
    // have to explicitly re-render the element.
    this._isEnabled = value;
  }

  get isInteractive(): boolean {
    return false;
  }

  get isStandalone(): boolean {
    return true;
  }

  get isInline(): boolean {
    return false;
  }

  get hasVisibleSeparator(): boolean {
    if (this.parent) {
      return !this.parent.isFirstElement(this) && this.isVisible;
    } else {
      return false;
    }
  }

  get parent(): CardElement | undefined {
    return this._parent as CardElement;
  }
}

export type AssociatedInputsType = "auto" | "none" | undefined;

export class AssociatedInputsProperty extends PropertyDefinition {
  parse(
    _sender: SerializableObject,
    source: PropertyBag,
    _context: SerializationContext
  ): AssociatedInputsType {
    const value = source[this.name];

    if (value !== undefined && typeof value === "string") {
      return value.toLowerCase() === "none" ? "none" : "auto";
    }

    return undefined;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: string | undefined,
    context: SerializationContext
  ) {
    context.serializeValue(target, this.name, value);
  }

  constructor(readonly targetVersion: Version, readonly name: string) {
    super(targetVersion, name, undefined);
  }
}

export abstract class Action extends RenderableCardObject implements IAction {
  // #region Schema

  static readonly titleProperty = new StringProperty(Versions.v1_0, "title");
  static readonly iconUrlProperty = new StringProperty(
    Versions.v1_1,
    "iconUrl"
  );
  static readonly styleProperty = new ValueSetProperty(
    Versions.v1_2,
    "style",
    [
      { value: ActionStyle.Default },
      { value: ActionStyle.Positive },
      { value: ActionStyle.Destructive },
    ],
    ActionStyle.Default
  );
  static readonly modeProperty = new ValueSetProperty(
    Versions.v1_5,
    "mode",
    [{ value: ActionMode.Primary }, { value: ActionMode.Secondary }],
    ActionMode.Primary
  );
  static readonly tooltipProperty = new StringProperty(
    Versions.v1_5,
    "tooltip"
  );
  static readonly isEnabledProperty = new BoolProperty(
    Versions.v1_5,
    "isEnabled",
    true
  );

  get title(): string | undefined {
    return this.getValue(Action.titleProperty);
  }

  set title(value: string | undefined) {
    this.setValue(Action.titleProperty, value);
  }

  get iconUrl(): string | undefined {
    return this.getValue(Action.iconUrlProperty);
  }

  set iconUrl(value: string | undefined) {
    this.setValue(Action.iconUrlProperty, value);
  }

  get style(): ActionStyle {
    return this.getValue(Action.styleProperty);
  }

  set style(value: ActionStyle) {
    this.setValue(Action.styleProperty, value);
  }

  get mode(): ActionMode {
    return this.getValue(Action.modeProperty);
  }

  set mode(value: ActionMode) {
    this.setValue(Action.modeProperty, value);
  }

  get tooltip(): string | undefined {
    return this.getValue(Action.tooltipProperty);
  }

  set tooltip(value: string | undefined) {
    this.setValue(Action.tooltipProperty, value);
  }

  get isEnabled(): boolean {
    return this.getValue(Action.isEnabledProperty);
  }

  set isEnabled(value: boolean) {
    this.setValue(Action.isEnabledProperty, value);
  }

  // #endregion

  private _owner?: IActionCollection;
  private _isFocusable = true;
  private _actionButton?: ActionButtonBase;
  private _executeTimer?: NodeJS.Timeout;

  private renderTitle(): JSX.Element {
    const renderedTitle = this._actionButton
      ? this._actionButton.renderTitle(this.title) ?? undefined
      : undefined;

    if (renderedTitle) {
      return renderedTitle;
    }

    // Cache hostConfig for perf
    const hostConfig = this.hostConfig;

    const props = createProps();
    props.style.overflow = "hidden";
    props.style.textOverflow = "ellipsis";

    if (
      !(
        hostConfig.actions.iconPlacement === ActionIconPlacement.AboveTitle ||
        hostConfig.actions.allowTitleToWrap
      )
    ) {
      props.style.whiteSpace = "nowrap";
    }

    return (
      <React.Fragment key="title">
        {React.createElement("div", props, this.title)}
      </React.Fragment>
    );
  }

  private renderIcon(): JSX.Element {
    // Cache hostConfig for perf
    const hostConfig = this.hostConfig;

    const props: ImgHTMLAttributes = { style: {} };
    props.src = this.iconUrl;
    props.style.width = `${hostConfig.actions.iconSize}px`;
    props.style.height = `${hostConfig.actions.iconSize}px`;
    props.style.flex = "0 0 auto";

    if (hostConfig.actions.iconPlacement !== ActionIconPlacement.AboveTitle) {
      props.style.maxHeight = "100%";
    }

    return (
      <React.Fragment key="icon">
        {this.renderImage({ allowExpand: false, isSelectable: false }, props)}
      </React.Fragment>
    );
  }

  private renderButtonContent(
    iconOnly: boolean,
    centerContent: boolean = true
  ): JSX.Element {
    // Cache hostConfig for perf
    const hostConfig = this.hostConfig;

    const props = createProps();
    props.className = "ac-pushButton-content";
    props.style.display = "flex";
    props.style.gap = "6px";
    props.style.alignItems = "center";

    if (centerContent) {
      props.style.justifyContent = "center";
    }

    props.style.minWidth = "0";

    let content: JSX.Element[];

    if (!this.iconUrl) {
      addClass(props, "noIcon");

      content = [this.renderTitle()];
    } else if (iconOnly) {
      addClass(props, "iconOnly");

      content = [this.renderIcon()];
    } else {
      if (hostConfig.actions.iconPlacement === ActionIconPlacement.AboveTitle) {
        addClass(props, "iconAbove");

        props.style.flexDirection = "column";
      } else {
        addClass(props, "iconLeft");
      }

      content = [this.renderIcon(), this.renderTitle()];
    }

    if (
      hostConfig.actions.actionsOrientation === Orientation.Horizontal &&
      hostConfig.actions.actionAlignment === ActionAlignment.Stretch
    ) {
      props.style.flex = "0 1 100%";
    } else {
      props.style.flex = "0 1 auto";
    }

    switch (this.state) {
      case ActionButtonState.Normal:
        // No additional classes needed
        break;
      case ActionButtonState.Expanded:
        addClass(props, hostConfig.makeCssClassName("expanded"));
        break;
      case ActionButtonState.Subdued:
        addClass(props, hostConfig.makeCssClassName("subdued"));
        break;
    }

    if (this.style && this.isEffectivelyEnabled()) {
      if (this.style === ActionStyle.Positive) {
        addClass(
          props,
          ...hostConfig.makeCssClassNames("primary", "style-positive")
        );
      } else {
        addClass(
          props,
          ...hostConfig.makeCssClassNames(`style-${this.style.toLowerCase()}`)
        );
      }
    }

    if (this.isExpandable) {
      addClass(props, this.hostConfig.makeCssClassName("expandable"));

      props["aria-expanded"] = this.state === ActionButtonState.Expanded;
    }

    return <div {...props}>{content}</div>;
  }

  protected getButtonMenuItems(): IActionButtonMenuItem[] | undefined {
    return undefined;
  }

  protected getAriaControlsAttribute(): string | undefined {
    return undefined;
  }

  protected getDefaultSerializationContext(): BaseSerializationContext {
    return new SerializationContext();
  }

  protected internalGetReferencedInputs(): Dictionary<IInput> {
    return {};
  }

  protected internalPrepareForExecution(
    _inputs: Dictionary<IInput> | undefined
  ) {
    // Do nothing in base implementation
  }

  protected internalValidateInputs(
    referencedInputs: Dictionary<IInput> | undefined
  ): IInput[] {
    const result: IInput[] = [];

    if (referencedInputs) {
      for (const key of Object.keys(referencedInputs)) {
        const input = referencedInputs[key];

        if (!input.validateValue()) {
          result.push(input);
        }
      }
    }

    return result;
  }

  protected shouldSerialize(context: SerializationContext): boolean {
    return (
      context.actionRegistry.findByName(this.getJsonTypeName()) !== undefined
    );
  }

  protected getEffectiveTooltip(): string | undefined {
    return this.tooltip || this.hostConfig.actions.defaultActionTooltip;
  }

  protected internalExecute() {
    if (this._owner) {
      this._owner.actionExecuted(this);
    }

    if (this.prepareForExecution()) {
      if (this.onExecute) {
        this.onExecute(this);
      }

      this.getRootObject()["actionExecuted"](this);
    }

    this.internalAfterExecute();
  }

  protected internalAfterExecute() {
    this.getRootObject().updateActionsEnabledState();
  }

  protected render(args?: RenderArgs): JSX.Element | null {
    const props: IActionButtonProps = {};

    this.setupElementForAccessibility(props);

    const buttonClickHandler = (e: IButtonClickEvent) => {
      if (this.isEffectivelyEnabled()) {
        e.preventDefault();
        e.stopPropagation();

        this.execute();
      }
    };

    const isInline = args ? args.isInline : false;

    const renderArgs: IActionButtonRenderArgs = {
      forcePrimary: false,
      renderedContent: this.renderButtonContent(isInline),
      isInline,
      onClick: buttonClickHandler,
    };

    if (!this._actionButton && GlobalRegistry.actionButtonRenderer) {
      this._actionButton = new GlobalRegistry.actionButtonRenderer(
        this,
        this.getButtonMenuItems()
      );
    }

    return this._actionButton
      ? this._actionButton.render(props, renderArgs)
      : null;
  }

  protected get domElement(): HTMLElement | undefined {
    return this._actionButton?.domElement ?? undefined;
  }

  onExecute?: (sender: Action) => void;

  state: ActionButtonState = ActionButtonState.Normal;

  getHref(): string | undefined {
    return "";
  }

  getAriaRole(): string {
    return "button";
  }

  setupElementForAccessibility(
    props: IActionButtonProps,
    promoteTooltipToLabel = false
  ) {
    props.tabIndex = this.isEffectivelyEnabled() ? 0 : -1;
    props.role = this.getAriaRole();

    if (!this.isEffectivelyEnabled()) {
      props.disabled = true;
      props["aria-disabled"] = true;
    } else {
      addClass(props, this.hostConfig.makeCssClassName("ac-selectable"));
    }

    props["aria-label"] = this.title;
    props["aria-controls"] = this.getAriaControlsAttribute();

    props.title = this.title;

    const effectiveTooltip = this.getEffectiveTooltip();

    if (effectiveTooltip) {
      const targetAriaAttribute = promoteTooltipToLabel
        ? this.title
          ? "aria-describedby"
          : "aria-label"
        : "aria-describedby";

      props[targetAriaAttribute] = effectiveTooltip;
      props.title = effectiveTooltip;
    }
  }

  parse(source: any, context?: SerializationContext) {
    return super.parse(source, context ? context : new SerializationContext());
  }

  execute(delay?: number) {
    if (delay != undefined && delay != null && delay > 0) {
      if (this._executeTimer) {
        clearTimeout(this._executeTimer);
      }
      this._executeTimer = setTimeout(() => this.internalExecute(), delay);
    } else {
      this.internalExecute();
    }
  }

  focus(): boolean {
    if (this._isFocusable && this._actionButton?.domElement) {
      this._actionButton.domElement.focus();

      return true;
    }

    return false;
  }

  expand(_suppressStyle = false, _raiseEvent = false) {
    // Do nothing in base implementation
  }

  collapse() {
    // Do nothing in base implementation
  }

  prepareForExecution(): boolean {
    const referencedInputs = this.getReferencedInputs();
    const invalidInputs = this.internalValidateInputs(referencedInputs);

    if (invalidInputs.length > 0) {
      invalidInputs[0].focus();

      return false;
    }

    this.internalPrepareForExecution(referencedInputs);

    return true;
  }

  asMenuItem(key: string): IActionButtonMenuItem {
    return {
      key,
      text: this.title,
      tooltip: this.getEffectiveTooltip(),
      disabled: !this.isEffectivelyEnabled(),
      iconUrl: this.iconUrl,
      renderedContent: this.renderButtonContent(
        false /* iconOnly */,
        false /* centerContent */
      ),
      onClick: () => {
        this.execute();
      },
    };
  }

  getAllInputs(_processActions = true): IInput[] {
    return [];
  }

  getAllActions(): IAction[] {
    return [this];
  }

  getResourceInformation(): IResourceInformation[] {
    return this.iconUrl ? [{ url: this.iconUrl, mimeType: "image" }] : [];
  }

  getActionById(id: string): IAction | undefined {
    return this.id === id ? this : undefined;
  }

  getReferencedInputs(): Dictionary<IInput> | undefined {
    return this.internalGetReferencedInputs();
  }

  getInlineContent(): RenderableCardObject | undefined {
    return undefined;
  }

  /**
   * Validates the inputs associated with this action.
   *
   * @returns A list of inputs that failed validation, or an empty array if no input failed validation.
   */
  validateInputs(): IInput[] {
    return this.internalValidateInputs(this.getReferencedInputs());
  }

  updateEnabledState() {
    // Do nothing in base implementation
  }

  isEffectivelyEnabled(): boolean {
    return this.isEnabled && (this.parent ? this.parent.isEnabled : true);
  }

  shouldRaiseOnExecuteEvent(): boolean {
    return true;
  }

  get isPrimary(): boolean {
    return this.style === ActionStyle.Positive;
  }

  set isPrimary(value: boolean) {
    if (value) {
      this.style = ActionStyle.Positive;
    } else {
      if (this.style === ActionStyle.Positive) {
        this.style = ActionStyle.Default;
      }
    }
  }

  get hostConfig(): HostConfig {
    return this.parent ? this.parent.hostConfig : defaultHostConfig;
  }

  get theme(): ThemeName {
    return this.parent ? this.parent.theme : ThemeName.Light;
  }

  get isFocusable(): boolean {
    return this._isFocusable;
  }

  set isFocusable(value: boolean) {
    if (this._isFocusable !== value) {
      this._isFocusable = value;

      this.updateLayout();
    }
  }

  get isExpandable(): boolean {
    return false;
  }

  get isExpanded(): boolean {
    return this.state === ActionButtonState.Expanded;
  }

  get isAtRootLevel(): boolean {
    // The action is at the root level if its parent element
    // doesn't itself have a parent
    return !this.parent?.parent;
  }
}

export class SerializationContext extends BaseSerializationContext {
  public static componentTypeName = "Component";

  private _elementRegistry?: CardObjectRegistry<CardElement>;
  private _actionRegistry?: CardObjectRegistry<Action>;

  private _forbiddenTypes: Set<string> = new Set<string>();
  private internalParseCardObject<T extends CardObject>(
    parent: CardObject | undefined,
    source: any,
    forbiddenTypes: Set<string>,
    allowFallback: boolean,
    createInstanceCallback: (typeName: string) => T | undefined,
    logParseEvent: (typeName: string, errorType: TypeErrorType) => void
  ): T | undefined {
    let result: T | undefined;

    if (source && typeof source === "object") {
      const oldForbiddenTypes = new Set<string>();
      this._forbiddenTypes.forEach((type) => {
        oldForbiddenTypes.add(type);
      });
      forbiddenTypes.forEach((type) => {
        this._forbiddenTypes.add(type);
      });

      const typeName = parseString(source["type"]);

      if (typeName) {
        if (this._forbiddenTypes.has(typeName)) {
          logParseEvent(typeName, TypeErrorType.ForbiddenType);
        } else {
          let tryToFallback = false;

          result = createInstanceCallback(typeName);

          if (!result) {
            tryToFallback = GlobalSettings.enableFallback && allowFallback;

            logParseEvent(typeName, TypeErrorType.UnknownType);
          } else {
            result.setParent(parent);
            result.parse(source, this);

            tryToFallback =
              GlobalSettings.enableFallback &&
              allowFallback &&
              result.shouldFallback();
          }

          if (tryToFallback) {
            const fallback = source["fallback"];

            if (fallback === undefined && parent) {
              parent.setShouldFallback(true);
            }

            if (
              typeof fallback === "string" &&
              fallback.toLowerCase() === "drop"
            ) {
              result = undefined;
            } else if (typeof fallback === "object") {
              result = this.internalParseCardObject<T>(
                parent,
                fallback,
                forbiddenTypes,
                true,
                createInstanceCallback,
                logParseEvent
              );
            } else {
              result = undefined;
            }
          }
        }
      }

      this._forbiddenTypes = oldForbiddenTypes;
    }

    return result;
  }

  protected cardObjectParsed(o: SerializableObject, source: any) {
    if (o instanceof Action && this.onParseAction) {
      this.onParseAction(o, source, this);
    } else if (o instanceof CardElement && this.onParseElement) {
      this.onParseElement(o, source, this);
    }
  }

  onParseAction?: (
    action: Action,
    source: any,
    context: SerializationContext
  ) => void;
  onParseElement?: (
    element: CardElement,
    source: any,
    context: SerializationContext
  ) => void;

  shouldSerialize(o: SerializableObject): boolean {
    if (o instanceof Action) {
      return this.actionRegistry.findByName(o.getJsonTypeName()) !== undefined;
    } else if (o instanceof CardElement) {
      return this.elementRegistry.findByName(o.getJsonTypeName()) !== undefined;
    } else {
      return true;
    }
  }

  parseCardObject<T extends CardObject>(
    parent: CardObject | undefined,
    source: any,
    forbiddenTypeNames: string[],
    allowFallback: boolean,
    createInstanceCallback: (typeName: string) => T | undefined,
    logParseEvent: (typeName: string, errorType: TypeErrorType) => void
  ): T | undefined {
    const forbiddenTypes = new Set<string>(forbiddenTypeNames);
    const result = this.internalParseCardObject(
      parent,
      source,
      forbiddenTypes,
      allowFallback,
      createInstanceCallback,
      logParseEvent
    );

    if (result !== undefined) {
      this.cardObjectParsed(result, source);
    }

    return result;
  }

  parseElement(
    parent: CardElement | undefined,
    source: any,
    forbiddenTypes: string[],
    allowFallback: boolean
  ): CardElement | undefined {
    return this.parseCardObject<CardElement>(
      parent,
      source,
      forbiddenTypes,
      allowFallback,
      (typeName: string) => {
        const effectiveTypeName =
          typeName === SerializationContext.componentTypeName &&
          "name" in source &&
          typeof source["name"] === "string"
            ? `${typeName}.${source["name"]}`
            : typeName;

        return this.elementRegistry.createInstance({
          context: this,
          typeName: effectiveTypeName,
          payload: source,
          targetVersion: this.targetVersion,
        });
      },
      (typeName: string, errorType: TypeErrorType) => {
        if (errorType === TypeErrorType.UnknownType) {
          this.logParseEvent(
            undefined,
            ValidationEvent.UnknownElementType,
            Strings.errors.unknownElementType(typeName)
          );
        } else {
          this.logParseEvent(
            undefined,
            ValidationEvent.ElementTypeNotAllowed,
            Strings.errors.elementTypeNotAllowed(typeName)
          );
        }
      }
    );
  }

  parseAction(
    parent: CardObject,
    source: any,
    forbiddenActionTypes: string[],
    allowFallback: boolean
  ): Action | undefined {
    return this.parseCardObject<Action>(
      parent,
      source,
      forbiddenActionTypes,
      allowFallback,
      (typeName: string) => {
        return this.actionRegistry.createInstance({
          context: this,
          typeName,
          payload: source,
          targetVersion: this.targetVersion,
        });
      },
      (typeName: string, errorType: TypeErrorType) => {
        if (errorType === TypeErrorType.UnknownType) {
          this.logParseEvent(
            undefined,
            ValidationEvent.UnknownActionType,
            Strings.errors.unknownActionType(typeName)
          );
        } else {
          this.logParseEvent(
            undefined,
            ValidationEvent.ActionTypeNotAllowed,
            Strings.errors.actionTypeNotAllowed(typeName)
          );
        }
      }
    );
  }

  get elementRegistry(): CardObjectRegistry<CardElement> {
    return this._elementRegistry ?? GlobalRegistry.elements;
  }

  // Not using a property setter here because the setter should accept "undefined"
  // whereas the getter should never return undefined.
  setElementRegistry(value: CardObjectRegistry<CardElement> | undefined) {
    this._elementRegistry = value;
  }

  get actionRegistry(): CardObjectRegistry<Action> {
    return this._actionRegistry ?? GlobalRegistry.actions;
  }

  // Not using a property setter here because the setter should accept "undefined"
  // whereas the getter should never return undefined.
  setActionRegistry(value: CardObjectRegistry<Action> | undefined) {
    this._actionRegistry = value;
  }
}

export interface ICreateCardObjectInstanceArgs {
  context: BaseSerializationContext;
  typeName: string;
  payload: object;
  targetVersion: Version;
}

export interface ITypeRegistration<T extends SerializableObject> {
  typeName: string;
  createInstance: (args: ICreateCardObjectInstanceArgs) => T;
  schemaVersion: Version;
}

export class CardObjectRegistry<T extends SerializableObject> {
  private _items: { [typeName: string]: ITypeRegistration<T> } = {};

  findByName(typeName: string): ITypeRegistration<T> | undefined {
    return this._items.hasOwnProperty(typeName)
      ? this._items[typeName]
      : undefined;
  }

  clear() {
    this._items = {};
  }

  copyTo(target: CardObjectRegistry<T>) {
    const keys = Object.keys(this._items);

    for (const key of keys) {
      const typeRegistration = this._items[key];

      target.register(
        typeRegistration.typeName,
        typeRegistration.createInstance,
        typeRegistration.schemaVersion
      );
    }
  }

  register(
    typeName: string,
    createInstance: (args: ICreateCardObjectInstanceArgs) => T,
    schemaVersion: Version = Versions.v1_0
  ) {
    let registrationInfo = this.findByName(typeName);

    if (registrationInfo !== undefined) {
      registrationInfo.createInstance = createInstance;
    } else {
      registrationInfo = {
        typeName,
        createInstance,
        schemaVersion,
      };
    }

    this._items[typeName] = registrationInfo;
  }

  unregister(typeName: string) {
    delete this._items[typeName];
  }

  createInstance(args: ICreateCardObjectInstanceArgs): T | undefined {
    const registrationInfo = this.findByName(args.typeName);

    return registrationInfo &&
      registrationInfo.schemaVersion.compareTo(args.targetVersion) <= 0
      ? registrationInfo.createInstance(args)
      : undefined;
  }

  getItemCount(): number {
    return Object.keys(this._items).length;
  }

  getItemAt(index: number): ITypeRegistration<T> {
    return Object.keys(this._items).map((e) => this._items[e])[index];
  }
}

export interface IButtonClickEvent {
  preventDefault(): void;
  stopPropagation(): void;
}

export interface IActionButtonMenuItem {
  key: string;
  text?: string;
  tooltip?: string;
  disabled?: boolean;
  iconUrl?: string;
  renderedContent?: JSX.Element;
  onClick?: () => void;
}

export interface IActionButtonRenderArgs {
  forcePrimary: boolean;
  renderedContent: JSX.Element;
  isInline: boolean;
  onClick: (e: IButtonClickEvent) => void;
}

export interface IActionButtonProps extends React.AriaAttributes {
  className?: string;
  tabIndex?: number;
  role?: React.AriaRole;
  disabled?: boolean;
  title?: string;
}

export abstract class ActionButtonBase {
  constructor(
    readonly action: IAction,
    readonly menuItems?: IActionButtonMenuItem[]
  ) {}

  abstract render(
    props: IActionButtonProps,
    args: IActionButtonRenderArgs
  ): JSX.Element | null;

  renderTitle(_title: string | undefined): JSX.Element | null {
    return null;
  }

  abstract get domElement(): HTMLElement | null;
}

export type ActionButtonClass = {
  new (action: IAction, menuItems?: IActionButtonMenuItem[]): ActionButtonBase;
};

export class GlobalRegistry {
  private static _elements?: CardObjectRegistry<CardElement>;
  private static _actions?: CardObjectRegistry<Action>;

  static actionButtonRenderer?: ActionButtonClass;

  static populateWithDefaultElements(
    registry: CardObjectRegistry<CardElement>
  ) {
    registry.clear();

    GlobalRegistry.defaultElements.copyTo(registry);
  }

  static populateWithDefaultActions(registry: CardObjectRegistry<Action>) {
    registry.clear();

    GlobalRegistry.defaultActions.copyTo(registry);
  }

  static readonly defaultElements = new CardObjectRegistry<CardElement>();
  static readonly defaultActions = new CardObjectRegistry<Action>();
  static get elements(): CardObjectRegistry<CardElement> {
    if (!GlobalRegistry._elements) {
      GlobalRegistry._elements = new CardObjectRegistry<CardElement>();
      GlobalRegistry.populateWithDefaultElements(GlobalRegistry._elements);
    }

    return GlobalRegistry._elements;
  }

  static get actions(): CardObjectRegistry<Action> {
    if (!GlobalRegistry._actions) {
      GlobalRegistry._actions = new CardObjectRegistry<Action>();
      GlobalRegistry.populateWithDefaultActions(GlobalRegistry._actions);
    }

    return GlobalRegistry._actions;
  }

  static reset() {
    GlobalRegistry._elements = undefined;
    GlobalRegistry._actions = undefined;
  }
}
