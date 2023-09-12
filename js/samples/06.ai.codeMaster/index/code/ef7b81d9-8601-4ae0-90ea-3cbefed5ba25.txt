import type * as React from "react";
import { ExecuteAction } from "../actions";
import type { OverflowAction } from "../actions/overflow-action";
import type {
  AllHTMLAttributes,
  BaseSerializationContext,
  IAction,
  IDataQueryRequest,
  IImage,
  IInput,
  IMarkdownProcessingResult,
  IProcessableUrl,
  ITextProperties,
  PropertyBag,
  RenderArgs,
  ValidationResults,
} from "../core";
import {
  CardElement,
  CustomProperty,
  PaddingDefinition,
  PropertyDefinition,
  SerializableObject,
  SerializableObjectCollectionProperty,
  SerializableObjectProperty,
  SerializationContext,
  Spacing,
  StringArrayProperty,
  StringProperty,
  Strings,
  ValidationEvent,
  Version,
  Versions,
  addClass,
} from "../core";
import { ContainerWithActions } from "./container-with-actions";

export class RefreshActionProperty extends PropertyDefinition {
  parse(
    sender: RefreshDefinition,
    source: PropertyBag,
    context: SerializationContext
  ): ExecuteAction | undefined {
    const action = context.parseAction(
      sender.parent,
      source[this.name],
      [],
      false
    );

    if (action !== undefined) {
      if (action instanceof ExecuteAction) {
        return action;
      }

      context.logParseEvent(
        sender,
        ValidationEvent.ActionTypeNotAllowed,
        Strings.errors.actionTypeNotAllowed(action.getJsonTypeName())
      );
    }

    context.logParseEvent(
      sender,
      ValidationEvent.PropertyCantBeNull,
      Strings.errors.propertyMustBeSet("action")
    );

    return undefined;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: ExecuteAction | undefined,
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

  constructor(readonly targetVersion: Version, readonly name: string) {
    super(targetVersion, name, undefined);
  }
}

export class RefreshDefinition extends SerializableObject {
  // #region Schema

  static readonly actionProperty = new RefreshActionProperty(
    Versions.v1_4,
    "action"
  );
  static readonly userIdsProperty = new StringArrayProperty(
    Versions.v1_4,
    "userIds"
  );

  get action(): ExecuteAction {
    return this.getValue(RefreshDefinition.actionProperty);
  }

  set action(value: ExecuteAction) {
    this.setValue(RefreshDefinition.actionProperty, value);

    if (value) {
      value.setParent(this.parent);
    }
  }

  get userIds(): string[] | undefined {
    return this.getValue(RefreshDefinition.userIdsProperty);
  }

  set userIds(value: string[] | undefined) {
    this.setValue(RefreshDefinition.userIdsProperty, value);
  }

  protected getSchemaKey(): string {
    return "RefreshDefinition";
  }

  // #endregion

  parent!: CardElement;
}

export class AuthCardButton extends SerializableObject {
  // #region Schema

  static readonly typeProperty = new StringProperty(Versions.v1_4, "type");
  static readonly titleProperty = new StringProperty(Versions.v1_4, "title");
  static readonly imageProperty = new StringProperty(Versions.v1_4, "image");
  static readonly valueProperty = new StringProperty(Versions.v1_4, "value");

  protected getSchemaKey(): string {
    return "AuthCardButton";
  }

  // #endregion

  get type(): string | undefined {
    return this.getValue(AuthCardButton.typeProperty);
  }

  set type(value: string | undefined) {
    this.setValue(AuthCardButton.typeProperty, value);
  }

  get title(): string | undefined {
    return this.getValue(AuthCardButton.titleProperty);
  }

  set title(value: string | undefined) {
    this.setValue(AuthCardButton.titleProperty, value);
  }

  get image(): string | undefined {
    return this.getValue(AuthCardButton.imageProperty);
  }

  set image(value: string | undefined) {
    this.setValue(AuthCardButton.imageProperty, value);
  }

  get value(): string | undefined {
    return this.getValue(AuthCardButton.valueProperty);
  }

  set value(value: string | undefined) {
    this.setValue(AuthCardButton.valueProperty, value);
  }
}

export class TokenExchangeResource extends SerializableObject {
  // #region Schema

  static readonly idProperty = new StringProperty(Versions.v1_4, "id");
  static readonly uriProperty = new StringProperty(Versions.v1_4, "uri");
  static readonly providerIdProperty = new StringProperty(
    Versions.v1_4,
    "providerId"
  );

  protected getSchemaKey(): string {
    return "TokenExchangeResource";
  }

  // #endregion

  get id(): string | undefined {
    return this.getValue(TokenExchangeResource.idProperty);
  }

  set id(value: string | undefined) {
    this.setValue(TokenExchangeResource.idProperty, value);
  }

  get uri(): string | undefined {
    return this.getValue(TokenExchangeResource.uriProperty);
  }

  set uri(value: string | undefined) {
    this.setValue(TokenExchangeResource.uriProperty, value);
  }

  get providerId(): string | undefined {
    return this.getValue(TokenExchangeResource.providerIdProperty);
  }

  set providerId(value: string | undefined) {
    this.setValue(TokenExchangeResource.providerIdProperty, value);
  }
}

export class Authentication extends SerializableObject {
  // #region Schema

  static readonly textProperty = new StringProperty(Versions.v1_4, "text");
  static readonly connectionNameProperty = new StringProperty(
    Versions.v1_4,
    "connectionName"
  );
  static readonly buttonsProperty = new SerializableObjectCollectionProperty(
    Versions.v1_4,
    "buttons",
    (_) => new AuthCardButton()
  );
  static readonly tokenExchangeResourceProperty =
    new SerializableObjectProperty(
      Versions.v1_4,
      "tokenExchangeResource",
      (_) => new TokenExchangeResource(),
      true
    );

  protected getSchemaKey(): string {
    return "Authentication";
  }

  // #endregion

  get text(): string | undefined {
    return this.getValue(Authentication.textProperty);
  }

  set text(value: string | undefined) {
    this.setValue(Authentication.textProperty, value);
  }

  get connectionName(): string | undefined {
    return this.getValue(Authentication.connectionNameProperty);
  }

  set connectionName(value: string | undefined) {
    this.setValue(Authentication.connectionNameProperty, value);
  }

  get buttons(): AuthCardButton[] {
    return this.getValue(Authentication.buttonsProperty);
  }

  set buttons(value: AuthCardButton[]) {
    this.setValue(Authentication.buttonsProperty, value);
  }

  get tokenExchangeResource(): TokenExchangeResource | undefined {
    return this.getValue(Authentication.tokenExchangeResourceProperty);
  }

  set tokenExchangeResource(value: TokenExchangeResource | undefined) {
    this.setValue(Authentication.tokenExchangeResourceProperty, value);
  }
}

// @dynamic
export class AdaptiveCard extends ContainerWithActions {
  static readonly schemaUrl =
    "https://adaptivecards.io/schemas/adaptive-card.json";

  // #region Schema

  protected static readonly $schemaProperty = new CustomProperty<string>(
    Versions.v1_0,
    "$schema",
    (
      _sender: SerializableObject,
      _property: PropertyDefinition,
      _source: PropertyBag,
      _context: BaseSerializationContext
    ) => {
      return AdaptiveCard.schemaUrl;
    },
    (
      _sender: SerializableObject,
      prop: PropertyDefinition,
      target: PropertyBag,
      _value: Versions | undefined,
      context: BaseSerializationContext
    ) => {
      context.serializeValue(target, prop.name, AdaptiveCard.schemaUrl);
    }
  );

  static readonly versionProperty = new CustomProperty<Version | undefined>(
    Versions.v1_0,
    "version",
    (
      sender: SerializableObject,
      prop: PropertyDefinition,
      source: PropertyBag,
      context: BaseSerializationContext
    ) => {
      let version = Version.parse(source[prop.name], context);

      if (version === undefined) {
        version = Versions.latest;

        context.logParseEvent(
          sender,
          ValidationEvent.InvalidPropertyValue,
          Strings.errors.invalidCardVersion(version.toString())
        );
      }

      return version;
    },
    (
      _sender: SerializableObject,
      prop: PropertyDefinition,
      target: PropertyBag,
      value: Version | undefined,
      context: BaseSerializationContext
    ) => {
      if (value !== undefined) {
        context.serializeValue(target, prop.name, value.toString());
      }
    },
    Versions.v1_0
  );

  static readonly fallbackTextProperty = new StringProperty(
    Versions.v1_0,
    "fallbackText"
  );
  static readonly speakProperty = new StringProperty(Versions.v1_0, "speak");
  static readonly refreshProperty = new SerializableObjectProperty(
    Versions.v1_4,
    "refresh",
    (_) => new RefreshDefinition(),
    true
  );
  static readonly authenticationProperty = new SerializableObjectProperty(
    Versions.v1_4,
    "authentication",
    (_) => new Authentication(),
    true
  );

  get version(): Version {
    return this.getValue(AdaptiveCard.versionProperty);
  }

  set version(value: Version) {
    this.setValue(AdaptiveCard.versionProperty, value);
  }

  get fallbackText(): string | undefined {
    return this.getValue(AdaptiveCard.fallbackTextProperty);
  }

  set fallbackText(value: string | undefined) {
    this.setValue(AdaptiveCard.fallbackTextProperty, value);
  }

  get speak(): string | undefined {
    return this.getValue(AdaptiveCard.speakProperty);
  }

  set speak(value: string | undefined) {
    this.setValue(AdaptiveCard.speakProperty, value);
  }

  get refresh(): RefreshDefinition | undefined {
    return this.getValue(AdaptiveCard.refreshProperty);
  }

  set refresh(value: RefreshDefinition | undefined) {
    this.setValue(AdaptiveCard.refreshProperty, value);

    if (value) {
      value.parent = this;
    }
  }

  get authentication(): Authentication | undefined {
    return this.getValue(AdaptiveCard.authenticationProperty);
  }

  set authentication(value: Authentication | undefined) {
    this.setValue(AdaptiveCard.authenticationProperty, value);
  }

  // #endregion

  static onExecuteAction?: (action: IAction) => void;
  static onElementVisibilityChanged?: (element: CardElement) => void;
  static onInlineCardExpanded?: (action: IAction, isExpanded: boolean) => void;
  static onInputValueChanged?: (input: IInput) => void;
  static onProcessMarkdown?: (
    text: string,
    properties: ITextProperties,
    result: IMarkdownProcessingResult
  ) => void;
  static onShouldDisplayBuiltInOverflowActionMenu?: (
    isRootLevelAction: boolean
  ) => boolean;
  static onDisplayOverflowActionMenu?: (
    actions: readonly IAction[],
    target?: HTMLElement
  ) => void;
  static onRenderAnchor?: (
    displayText: string | undefined,
    props: React.AnchorHTMLAttributes<HTMLAnchorElement>
  ) => JSX.Element | null;
  static onRenderImage?: (
    image: IImage,
    props: React.ImgHTMLAttributes<HTMLImageElement>
  ) => JSX.Element | null;
  static onProcessUrl?: (url: IProcessableUrl) => boolean;
  static onDataQuery?: (request: IDataQueryRequest) => boolean;
  static onShouldDisplayBuiltInOverflowActionButton?: (
    actions: readonly IAction[],
    isRootLevelActions: boolean
  ) => boolean;

  private _fallbackCard?: AdaptiveCard;

  private isVersionSupported(): boolean {
    if (this.bypassVersionCheck) {
      return true;
    } else {
      const unsupportedVersion: boolean =
        !this.version ||
        !this.version.isValid ||
        this.maxVersion.major < this.version.major ||
        (this.maxVersion.major === this.version.major &&
          this.maxVersion.minor < this.version.minor);

      return !unsupportedVersion;
    }
  }

  private getRootCard(): AdaptiveCard {
    if (!this.parent) {
      return this;
    }

    const card = this.getRootObject();

    if (card instanceof AdaptiveCard) {
      return card;
    }

    return this;
  }

  protected shouldDisplayBuiltInOverflowActionButton(
    action: OverflowAction
  ): boolean {
    const handler =
      this.getRootCard().onShouldDisplayBuiltInOverflowActionButton ??
      AdaptiveCard.onShouldDisplayBuiltInOverflowActionButton;

    return handler !== undefined
      ? handler(action.getActions(), action.isAtRootLevel)
      : true;
  }

  protected shouldDisplayBuiltInOverflowActionMenu(
    action: OverflowAction
  ): boolean {
    const handler =
      this.getRootCard().onShouldDisplayBuiltInOverflowActionMenu ??
      AdaptiveCard.onShouldDisplayBuiltInOverflowActionMenu;

    return handler !== undefined ? handler(action.isAtRootLevel) : true;
  }

  protected displayOverflowActionMenu(
    action: OverflowAction,
    target?: HTMLElement
  ) {
    const handler =
      this.getRootCard().onDisplayOverflowActionMenu ??
      AdaptiveCard.onDisplayOverflowActionMenu;

    if (handler !== undefined) {
      handler(action.getActions(), target);
    }
  }

  protected actionExecuted(action: IAction) {
    const handler =
      this.getRootCard().onExecuteAction ?? AdaptiveCard.onExecuteAction;

    if (handler) {
      handler(action);
    }
  }

  protected elementVisibilityChanged(element: CardElement) {
    const handler =
      this.getRootCard().onElementVisibilityChanged ??
      AdaptiveCard.onElementVisibilityChanged;

    if (handler) {
      handler(element);
    }
  }

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    if (this.shouldFallback() && this._fallbackCard) {
      this._fallbackCard.hostConfig = this.hostConfig;

      return this._fallbackCard.render();
    }

    return super.internalRender();
  }

  protected customizeProps(props: AllHTMLAttributes) {
    super.customizeProps(props);

    addClass(props, this.hostConfig.makeCssClassName("ac-adaptiveCard"));

    if (this.isFocusable) {
      props.tabIndex = 0;
    }

    if (this.speak) {
      props["aria-label"] = this.speak;
    }
  }

  protected getDefaultSerializationContext(): BaseSerializationContext {
    return new SerializationContext(this.version);
  }

  protected getItemsCollectionPropertyName(): string {
    return "body";
  }

  protected internalParse(source: any, context: SerializationContext) {
    this._fallbackCard = undefined;

    const fallbackElement = context.parseElement(
      undefined,
      source["fallback"],
      this.forbiddenChildElements(),
      true
    );

    if (fallbackElement) {
      this._fallbackCard = new AdaptiveCard();
      this._fallbackCard.addItem(fallbackElement);
    }

    super.internalParse(source, context);
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    this.setValue(AdaptiveCard.versionProperty, context.targetVersion);

    super.internalToJSON(target, context);
  }

  protected getHasBackground(_ignoreBackgroundImages = false): boolean {
    return true;
  }

  protected getDefaultPadding(): PaddingDefinition {
    return new PaddingDefinition(
      Spacing.Padding,
      Spacing.Padding,
      Spacing.Padding,
      Spacing.Padding
    );
  }

  protected shouldSerialize(_context: SerializationContext): boolean {
    return true;
  }

  protected get renderIfEmpty(): boolean {
    return true;
  }

  protected get bypassVersionCheck(): boolean {
    return false;
  }

  protected get allowCustomStyle() {
    return (
      this.hostConfig.adaptiveCard &&
      this.hostConfig.adaptiveCard.allowCustomStyle
    );
  }

  protected get hasBackground(): boolean {
    return true;
  }

  isFocusable = true;

  onExecuteAction?: (action: IAction) => void;
  onElementVisibilityChanged?: (element: CardElement) => void;
  onInlineCardExpanded?: (action: IAction, isExpanded: boolean) => void;
  onInputValueChanged?: (input: IInput) => void;
  onShouldDisplayBuiltInOverflowActionMenu?: (
    isRootLevelAction: boolean
  ) => boolean;
  onDisplayOverflowActionMenu?: (
    actions: readonly IAction[],
    target?: HTMLElement
  ) => void;
  onShouldDisplayBuiltInOverflowActionButton?: (
    actions: readonly IAction[],
    isRootLevelActions: boolean
  ) => boolean;
  onRenderAnchor?: (
    displayText: string | undefined,
    props: React.AnchorHTMLAttributes<HTMLAnchorElement>
  ) => JSX.Element | null;
  onRenderImage?: (
    image: IImage,
    props: React.ImgHTMLAttributes<HTMLImageElement>
  ) => JSX.Element | null;
  onProcessUrl?: (url: IProcessableUrl) => boolean;
  onDataQuery?: (request: IDataQueryRequest) => boolean;
  onProcessMarkdown?: (
    text: string,
    properties: ITextProperties,
    result: IMarkdownProcessingResult
  ) => void;

  getJsonTypeName(): string {
    return "AdaptiveCard";
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    if (this.getValue(CardElement.typeNameProperty) !== "AdaptiveCard") {
      context.addFailure(
        this,
        ValidationEvent.MissingCardType,
        Strings.errors.invalidCardType()
      );
    }

    if (!this.bypassVersionCheck && !this.version) {
      context.addFailure(
        this,
        ValidationEvent.PropertyCantBeNull,
        Strings.errors.propertyMustBeSet("version")
      );
    } else if (!this.isVersionSupported()) {
      context.addFailure(
        this,
        ValidationEvent.UnsupportedCardVersion,
        Strings.errors.unsupportedCardVersion(
          this.version.toString(),
          this.maxVersion.toString()
        )
      );
    }
  }

  shouldFallback(): boolean {
    return super.shouldFallback() || !this.isVersionSupported();
  }

  renderImage(
    image: IImage,
    props: React.ImgHTMLAttributes<HTMLImageElement>
  ): JSX.Element | null {
    if (this.parent) {
      // If this AdaptiveCard has a parent, it is not the root
      return this.parent.renderImage(image, props);
    }

    const handler = this.onRenderImage ?? AdaptiveCard.onRenderImage;

    return handler ? handler(image, props) : super.renderImage(image, props);
  }

  renderAnchor(
    displayText: string | undefined,
    props: React.AnchorHTMLAttributes<HTMLAnchorElement>
  ): JSX.Element | null {
    if (this.parent) {
      // If this AdaptiveCard has a parent, it is not the root
      return this.parent.renderAnchor(displayText, props);
    }

    const handler = this.onRenderAnchor ?? AdaptiveCard.onRenderAnchor;

    return handler
      ? handler(displayText, props)
      : super.renderAnchor(displayText, props);
  }

  processUrl(url: IProcessableUrl): boolean {
    if (this.parent) {
      // If this AdaptiveCard has a parent, it is not the root
      return this.parent.processUrl(url);
    }

    const handler = this.onProcessUrl ?? AdaptiveCard.onProcessUrl;

    return handler ? handler(url) : super.processUrl(url);
  }

  dataQuery(request: IDataQueryRequest): boolean {
    if (this.parent) {
      return this.parent.dataQuery(request);
    }
    const handler = this.onDataQuery ?? AdaptiveCard.onDataQuery;
    return handler ? handler(request) : super.dataQuery(request);
  }

  get isInSubCard(): boolean {
    return this.parent ? true : false;
  }

  get hasVisibleSeparator(): boolean {
    return false;
  }
}
