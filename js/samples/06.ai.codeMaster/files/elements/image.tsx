import * as React from "react";
import { ActionProperty } from "../actions";
import type {
  Action,
  AllHTMLAttributes,
  BaseSerializationContext,
  IAction,
  ImgHTMLAttributes,
  IResourceInformation,
  PropertyBag,
  RenderArgs,
  SerializableObject,
  SerializableObjectSchema,
  ValueSetProperty,
  Version,
} from "../core";
import {
  addClass,
  BoolProperty,
  CardElement,
  createProps,
  EnumProperty,
  HorizontalAlignment,
  ImageStyle,
  PropertyDefinition,
  Size,
  SizeAndUnit,
  SizeUnit,
  StringProperty,
  Strings,
  stringToCssColor,
  ValidationEvent,
  Versions,
} from "../core";

class ImageDimensionProperty extends PropertyDefinition {
  getInternalName(): string {
    return this.internalName;
  }

  parse(
    sender: SerializableObject,
    source: PropertyBag,
    context: BaseSerializationContext
  ): number | undefined {
    let result: number | undefined;
    const sourceValue = source[this.name];

    if (sourceValue === undefined) {
      return this.defaultValue;
    }

    let isValid = false;

    if (typeof sourceValue === "string") {
      try {
        const size = SizeAndUnit.parse(sourceValue, true);

        if (size.unit === SizeUnit.Pixel) {
          result = size.physicalSize;

          isValid = true;
        }
      } catch {
        // Swallow the exception
      }

      // If the source value isn't valid per this property definition,
      // check its validity per the fallback property, if specified
      if (!isValid && this.fallbackProperty) {
        isValid = this.fallbackProperty.isValidValue(sourceValue, context);
      }
    }

    if (!isValid) {
      context.logParseEvent(
        sender,
        ValidationEvent.InvalidPropertyValue,
        Strings.errors.invalidPropertyValue(sourceValue, this.name)
      );
    }

    return result;
  }

  toJSON(
    _sender: SerializableObject,
    target: PropertyBag,
    value: number | undefined,
    context: BaseSerializationContext
  ) {
    context.serializeValue(
      target,
      this.name,
      typeof value === "number" && !isNaN(value) ? `${value}px` : undefined
    );
  }

  constructor(
    readonly targetVersion: Version,
    readonly name: string,
    readonly internalName: string,
    readonly fallbackProperty?: ValueSetProperty
  ) {
    super(targetVersion, name);
  }
}

export class Image extends CardElement {
  // #region Schema

  static readonly urlProperty = new StringProperty(Versions.v1_0, "url");
  static readonly altTextProperty = new StringProperty(
    Versions.v1_0,
    "altText"
  );
  static readonly backgroundColorProperty = new StringProperty(
    Versions.v1_1,
    "backgroundColor"
  );
  static readonly styleProperty = new EnumProperty(
    Versions.v1_0,
    "style",
    ImageStyle,
    ImageStyle.Default
  );
  static readonly sizeProperty = new EnumProperty(
    Versions.v1_0,
    "size",
    Size,
    Size.Auto
  );
  static readonly pixelWidthProperty = new ImageDimensionProperty(
    Versions.v1_1,
    "width",
    "pixelWidth"
  );
  static readonly pixelHeightProperty = new ImageDimensionProperty(
    Versions.v1_1,
    "height",
    "pixelHeight",
    CardElement.heightProperty
  );
  static readonly selectActionProperty = new ActionProperty(
    Versions.v1_1,
    "selectAction",
    ["Action.ShowCard"]
  );
  static readonly allowExpandProperty = new BoolProperty(
    Versions.v1_2,
    "allowExpand",
    false
  );

  protected populateSchema(schema: SerializableObjectSchema) {
    super.populateSchema(schema);

    schema.remove(CardElement.heightProperty);
  }

  get url(): string | undefined {
    return this.getValue(Image.urlProperty);
  }

  set url(value: string | undefined) {
    this.setValue(Image.urlProperty, value);
  }

  get altText(): string | undefined {
    return this.getValue(Image.altTextProperty);
  }

  set altText(value: string | undefined) {
    this.setValue(Image.altTextProperty, value);
  }

  get backgroundColor(): string | undefined {
    return this.getValue(Image.backgroundColorProperty);
  }

  set backgroundColor(value: string | undefined) {
    this.setValue(Image.backgroundColorProperty, value);
  }

  get size(): Size {
    return this.getValue(Image.sizeProperty);
  }

  set size(value: Size) {
    this.setValue(Image.sizeProperty, value);
  }

  get style(): ImageStyle {
    return this.getValue(Image.styleProperty);
  }

  set style(value: ImageStyle) {
    this.setValue(Image.styleProperty, value);
  }

  get pixelWidth(): number | undefined {
    return this.getValue(Image.pixelWidthProperty);
  }

  set pixelWidth(value: number | undefined) {
    this.setValue(Image.pixelWidthProperty, value);
  }

  get pixelHeight(): number | undefined {
    return this.getValue(Image.pixelHeightProperty);
  }

  set pixelHeight(value: number | undefined) {
    this.setValue(Image.pixelHeightProperty, value);
  }

  get selectAction(): Action | undefined {
    return this.getValue(Image.selectActionProperty);
  }

  set selectAction(value: Action | undefined) {
    this.setValue(Image.selectActionProperty, value);
  }

  get allowExpand(): boolean {
    return this.getValue(Image.allowExpandProperty);
  }

  set allowExpand(value: boolean) {
    this.setValue(Image.allowExpandProperty, value);
  }

  // #endregion

  private applySize(props: AllHTMLAttributes) {
    if (this.pixelWidth || this.pixelHeight) {
      if (this.pixelWidth) {
        props.style.width = `${this.pixelWidth}px`;
      }

      if (this.pixelHeight) {
        props.style.height = `${this.pixelHeight}px`;
      }
    } else {
      if (this.maxHeight) {
        // If the image is constrained in height, we set its height property and
        // auto and stretch are ignored (default to medium). THis is necessary for
        // ImageSet which uses a maximum image height as opposed to the cards width
        // as a constraining dimension
        switch (this.size) {
          case Size.Small:
            props.style.height = `${this.hostConfig.imageSizes.small}px`;
            break;
          case Size.Large:
            props.style.height = `${this.hostConfig.imageSizes.large}px`;
            break;
          default:
            props.style.height = `${this.hostConfig.imageSizes.medium}px`;
            break;
        }

        props.style.maxHeight = `${this.maxHeight}px`;
      } else {
        switch (this.size) {
          case Size.Stretch:
            props.style.width = "100%";
            break;
          case Size.Auto:
            props.style.maxWidth = "100%";
            break;
          case Size.Small:
            props.style.width = `${this.hostConfig.imageSizes.small}px`;
            break;
          case Size.Large:
            props.style.width = `${this.hostConfig.imageSizes.large}px`;
            break;
          case Size.Medium:
            props.style.width = `${this.hostConfig.imageSizes.medium}px`;
            break;
        }

        props.style.maxHeight = "100%";
      }
    }
  }

  protected get useDefaultSizing() {
    return false;
  }

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    if (this.url) {
      const props = createProps();
      props.style.display = "flex";
      props.style.alignItems = "flex-start";

      // Cache hostConfig to avoid walking the parent hierarchy multiple times
      const hostConfig = this.hostConfig;

      switch (this.getEffectiveHorizontalAlignment()) {
        case HorizontalAlignment.Center:
          props.style.justifyContent = "center";
          break;
        case HorizontalAlignment.Right:
          props.style.justifyContent = "flex-end";
          break;
        default:
          props.style.justifyContent = "flex-start";
          break;
      }

      const imageProps: ImgHTMLAttributes = { style: {} };

      // Handle image loading error

      imageProps.style = { minWidth: "0" };
      imageProps.className = hostConfig.makeCssClassName("ac-image");

      if (this.selectAction && hostConfig.supportsInteractivity) {
        imageProps.onKeyPress = (e) => {
          if (
            this.selectAction &&
            this.selectAction.isEffectivelyEnabled() &&
            (e.code === "Enter" || e.code === "Space")
          ) {
            // enter or space pressed
            e.preventDefault();
            e.stopPropagation();

            this.selectAction.execute();
          }
        };

        imageProps.onClick = (e) => {
          if (this.selectAction && this.selectAction.isEffectivelyEnabled()) {
            e.preventDefault();
            e.stopPropagation();

            this.selectAction.execute();
          }
        };

        this.selectAction.setupElementForAccessibility(imageProps);

        if (this.selectAction.isEffectivelyEnabled()) {
          addClass(imageProps, hostConfig.makeCssClassName("ac-selectable"));
        }
      }

      this.applySize(imageProps);

      if (this.style === ImageStyle.Person) {
        imageProps.style.borderRadius = "50%";
        imageProps.style.backgroundPosition = "50% 50%";
        imageProps.style.backgroundRepeat = "no-repeat";
      }

      const backgroundColor = stringToCssColor(this.backgroundColor);
      if (backgroundColor) {
        imageProps.style.backgroundColor = backgroundColor;
      }

      imageProps.src = this.preProcessPropertyValue(Image.urlProperty);

      const altTextProperty = this.preProcessPropertyValue(
        Image.altTextProperty
      );
      if (altTextProperty) {
        imageProps.alt = altTextProperty;
      }

      return React.createElement(
        "div",
        props,
        // TODO: Set allowExpand correctly
        this.renderImage(
          {
            allowExpand: this.allowExpand,
            isSelectable: this.selectAction !== undefined,
          },
          imageProps
        )
      );
    }

    return null;
  }

  maxHeight?: number;

  getJsonTypeName(): string {
    return "Image";
  }

  getAllActions(): IAction[] {
    const result = super.getAllActions();

    if (this.selectAction) {
      result.push(this.selectAction);
    }

    return result;
  }

  getActionById(id: string): IAction | undefined {
    let result = super.getActionById(id);

    if (!result && this.selectAction) {
      result = this.selectAction.getActionById(id);
    }

    return result;
  }

  getResourceInformation(): IResourceInformation[] {
    return this.url ? [{ url: this.url, mimeType: "image" }] : [];
  }
}
