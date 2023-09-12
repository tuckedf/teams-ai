import * as React from "react";
import { ActionProperty } from "../actions/action-property";
import type {
  Action,
  AllHTMLAttributes,
  BaseTextDefinition,
  ColorSetDefinition,
  FontTypeDefinition,
  IAction,
  IMarkdownProcessingResult,
  ITextProperties,
  RenderArgs,
  SerializableObjectSchema,
  TextBlockStyle,
  TextColorDefinition,
  TextStyleDefinition,
} from "../core";
import {
  addClass,
  BoolProperty,
  CardElement,
  EnumProperty,
  FontType,
  formatText,
  GlobalSettings,
  HorizontalAlignment,
  NumProperty,
  StringProperty,
  stringToCssColor,
  TextColor,
  TextSize,
  TextWeight,
  ValueSetProperty,
  Versions,
} from "../core";
import { AdaptiveCard } from "./adaptive-card";

export abstract class BaseTextBlock extends CardElement {
  // #region Schema

  static readonly textProperty = new StringProperty(
    Versions.v1_0,
    "text",
    true
  );
  static readonly sizeProperty = new EnumProperty(
    Versions.v1_0,
    "size",
    TextSize
  );
  static readonly weightProperty = new EnumProperty(
    Versions.v1_0,
    "weight",
    TextWeight
  );
  static readonly colorProperty = new EnumProperty(
    Versions.v1_0,
    "color",
    TextColor
  );
  static readonly isSubtleProperty = new BoolProperty(
    Versions.v1_0,
    "isSubtle"
  );
  static readonly fontTypeProperty = new EnumProperty(
    Versions.v1_2,
    "fontType",
    FontType
  );
  static readonly selectActionProperty = new ActionProperty(
    Versions.v1_1,
    "selectAction",
    ["Action.ShowCard"]
  );

  protected populateSchema(schema: SerializableObjectSchema) {
    super.populateSchema(schema);

    // selectAction is declared on BaseTextBlock but is only exposed on TextRun,
    // so the property is removed from the BaseTextBlock schema.
    schema.remove(BaseTextBlock.selectActionProperty);
  }

  get size(): TextSize | undefined {
    return this.getValue(BaseTextBlock.sizeProperty);
  }

  set size(value: TextSize | undefined) {
    this.setValue(BaseTextBlock.sizeProperty, value);
  }

  get weight(): TextWeight | undefined {
    return this.getValue(BaseTextBlock.weightProperty);
  }

  set weight(value: TextWeight | undefined) {
    this.setValue(BaseTextBlock.weightProperty, value);
  }

  get color(): TextColor | undefined {
    return this.getValue(BaseTextBlock.colorProperty);
  }

  set color(value: TextColor | undefined) {
    this.setValue(BaseTextBlock.colorProperty, value);
  }

  get fontType(): FontType | undefined {
    return this.getValue(BaseTextBlock.fontTypeProperty);
  }

  set fontType(value: FontType | undefined) {
    this.setValue(BaseTextBlock.fontTypeProperty, value);
  }

  get isSubtle(): boolean | undefined {
    return this.getValue(BaseTextBlock.isSubtleProperty);
  }

  set isSubtle(value: boolean | undefined) {
    this.setValue(BaseTextBlock.isSubtleProperty, value);
  }

  get text(): string | undefined {
    return this.getValue(BaseTextBlock.textProperty);
  }

  set text(value: string | undefined) {
    this.setText(value);
  }

  get selectAction(): Action | undefined {
    return this.getValue(BaseTextBlock.selectActionProperty);
  }

  set selectAction(value: Action | undefined) {
    this.setValue(BaseTextBlock.selectActionProperty, value);
  }

  // #endregion

  protected getFontSize(fontType: FontTypeDefinition): number {
    switch (this.effectiveSize) {
      case TextSize.Small:
        return fontType.fontSizes.small;
      case TextSize.Medium:
        return fontType.fontSizes.medium;
      case TextSize.Large:
        return fontType.fontSizes.large;
      case TextSize.ExtraLarge:
        return fontType.fontSizes.extraLarge;
      default:
        return fontType.fontSizes.default;
    }
  }

  protected getColorDefinition(
    colorSet: ColorSetDefinition,
    color: TextColor
  ): TextColorDefinition {
    switch (color) {
      case TextColor.Accent:
        return colorSet.accent;
      case TextColor.Dark:
        return colorSet.dark;
      case TextColor.Light:
        return colorSet.light;
      case TextColor.Good:
        return colorSet.good;
      case TextColor.Warning:
        return colorSet.warning;
      case TextColor.Attention:
        return colorSet.attention;
      default:
        return colorSet.default;
    }
  }

  protected setText(value: string | undefined) {
    this.setValue(BaseTextBlock.textProperty, value);
  }

  ariaHidden = false;

  constructor(text?: string) {
    super();

    if (text) {
      this.text = text;
    }
  }

  init(textDefinition: BaseTextDefinition) {
    this.size = textDefinition.size;
    this.weight = textDefinition.weight;
    this.color = textDefinition.color;
    this.isSubtle = textDefinition.isSubtle;
  }

  asString(): string | undefined {
    return this.text;
  }

  applyStylesTo(props: AllHTMLAttributes) {
    const fontType = this.hostConfig.getFontTypeDefinition(
      this.effectiveFontType
    );

    if (fontType.fontFamily) {
      props.style.fontFamily = fontType.fontFamily;
    }

    let fontSize: number;

    switch (this.effectiveSize) {
      case TextSize.Small:
        fontSize = fontType.fontSizes.small;
        break;
      case TextSize.Medium:
        fontSize = fontType.fontSizes.medium;
        break;
      case TextSize.Large:
        fontSize = fontType.fontSizes.large;
        break;
      case TextSize.ExtraLarge:
        fontSize = fontType.fontSizes.extraLarge;
        break;
      default:
        fontSize = fontType.fontSizes.default;
        break;
    }

    props.style.fontSize = `${fontSize}px`;

    const colorDefinition = this.getColorDefinition(
      this.getEffectiveStyleDefinition().foregroundColors,
      this.effectiveColor
    );

    const targetColor = stringToCssColor(
      this.effectiveIsSubtle ? colorDefinition.subtle : colorDefinition.default
    );
    if (targetColor) {
      props.style.color = targetColor;
    }

    switch (this.effectiveWeight) {
      case TextWeight.Lighter:
        props.style.fontWeight = fontType.fontWeights.lighter;
        break;
      case TextWeight.Bolder:
        props.style.fontWeight = fontType.fontWeights.bolder;
        break;
      default:
        props.style.fontWeight = fontType.fontWeights.default;
        break;
    }

    if (this.ariaHidden) {
      props["aria-hidden"] = "true";
    }
  }

  getAllActions(): IAction[] {
    const result = super.getAllActions();

    if (this.selectAction) {
      result.push(this.selectAction);
    }

    return result;
  }

  get effectiveColor(): TextColor {
    return this.color !== undefined
      ? this.color
      : this.getEffectiveTextStyleDefinition().color;
  }

  get effectiveFontType(): FontType {
    return this.fontType !== undefined
      ? this.fontType
      : this.getEffectiveTextStyleDefinition().fontType;
  }

  get effectiveIsSubtle(): boolean {
    return this.isSubtle !== undefined
      ? this.isSubtle
      : this.getEffectiveTextStyleDefinition().isSubtle;
  }

  get effectiveSize(): TextSize {
    return this.size !== undefined
      ? this.size
      : this.getEffectiveTextStyleDefinition().size;
  }

  get effectiveWeight(): TextWeight {
    return this.weight !== undefined
      ? this.weight
      : this.getEffectiveTextStyleDefinition().weight;
  }
}

export class TextBlock extends BaseTextBlock implements ITextProperties {
  // #region Schema

  static readonly wrapProperty = new BoolProperty(Versions.v1_0, "wrap", false);
  static readonly maxLinesProperty = new NumProperty(Versions.v1_0, "maxLines");
  static readonly styleProperty = new ValueSetProperty(Versions.v1_5, "style", [
    { value: "default" },
    { value: "columnHeader" },
    { value: "heading" },
  ]);

  get wrap(): boolean {
    return this.getValue(TextBlock.wrapProperty);
  }

  set wrap(value: boolean) {
    this.setValue(TextBlock.wrapProperty, value);
  }

  get maxLines(): number | undefined {
    return this.getValue(TextBlock.maxLinesProperty);
  }

  set maxLines(value: number | undefined) {
    this.setValue(TextBlock.maxLinesProperty, value);
  }

  get style(): TextBlockStyle | undefined {
    return this.getValue(TextBlock.styleProperty);
  }

  set style(value: TextBlockStyle | undefined) {
    this.setValue(TextBlock.styleProperty, value);
  }

  // #endregion

  private _computedLineHeight!: number;

  private processMarkdown(text: string): IMarkdownProcessingResult {
    const result: IMarkdownProcessingResult = {
      didProcess: false,
    };

    const card = this.getRootElement();

    if (card instanceof AdaptiveCard && card.onProcessMarkdown) {
      card.onProcessMarkdown(text, this, result);
    } else if (AdaptiveCard.onProcessMarkdown) {
      AdaptiveCard.onProcessMarkdown(text, this, result);
    }

    return result;
  }

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    if (this.text) {
      const preProcessedText = this.preProcessPropertyValue(
        BaseTextBlock.textProperty
      );
      const hostConfig = this.hostConfig;

      const props: React.DetailedHTMLProps<
        React.AllHTMLAttributes<HTMLDivElement>,
        HTMLDivElement
      > & { style: React.CSSProperties } = { style: {} };
      props.id = this.id;
      props.htmlFor = this.forElementId;
      props.className = hostConfig.makeCssClassName("ac-textBlock");
      props.style.overflow = "hidden";

      this.applyStylesTo(props);

      if (this.style === "heading") {
        props["role"] = "heading";

        const headingLevel = this.hostConfig.textBlock.headingLevel;

        if (headingLevel !== undefined && headingLevel > 0) {
          props["aria-level"] = headingLevel;
        }
      }

      if (this.selectAction && hostConfig.supportsInteractivity) {
        props.onClick = (e) => {
          if (this.selectAction && this.selectAction.isEffectivelyEnabled()) {
            e.preventDefault();
            e.stopPropagation();

            this.selectAction.execute();
          }
        };

        this.selectAction.setupElementForAccessibility(props);

        if (this.selectAction.isEffectivelyEnabled()) {
          addClass(props, hostConfig.makeCssClassName("ac-selectable"));
        }
      }

      const formattedText = formatText(this.lang, preProcessedText);

      const markdownProcessingResult =
        this.useMarkdown && formattedText
          ? this.processMarkdown(formattedText)
          : { didProcess: false };

      if (
        markdownProcessingResult.didProcess &&
        markdownProcessingResult.output
      ) {
        props.children = markdownProcessingResult.output;
      } else {
        props.children = formattedText;
      }

      if (this.wrap) {
        props.style.wordWrap = "break-word";

        if (this.maxLines && this.maxLines > 0) {
          props.style.overflow = "hidden";

          if (!GlobalSettings.useWebkitLineClamp) {
            props.style.maxHeight = `${
              this._computedLineHeight * this.maxLines
            }px`;
          } else {
            // While non standard, --webkit-line-clamp works in every browser (except IE)
            // and is a great solution to support the maxLines feature with ellipsis
            // truncation. With --webkit-line-clamp there is need to use explicit line heights
            props.style["lineHeight"] = undefined;
            props.style.display = "-webkit-box";
            props.style.WebkitBoxOrient = "vertical";
            props.style.WebkitLineClamp = this.maxLines;
          }
        }
      } else {
        props.style.whiteSpace = "nowrap";
      }

      props.style.textOverflow = "ellipsis";

      return React.createElement(this.forElementId ? "label" : "div", props);
    }

    return null;
  }

  useMarkdown = true;
  forElementId?: string;

  applyStylesTo(props: AllHTMLAttributes) {
    super.applyStylesTo(props);

    switch (this.getEffectiveHorizontalAlignment()) {
      case HorizontalAlignment.Center:
        props.style.textAlign = "center";
        break;
      case HorizontalAlignment.Right:
        props.style.textAlign = "end";
        break;
      default:
        props.style.textAlign = "start";
        break;
    }

    const lineHeights = this.hostConfig.lineHeights;

    if (lineHeights) {
      switch (this.effectiveSize) {
        case TextSize.Small:
          this._computedLineHeight = lineHeights.small;
          break;
        case TextSize.Medium:
          this._computedLineHeight = lineHeights.medium;
          break;
        case TextSize.Large:
          this._computedLineHeight = lineHeights.large;
          break;
        case TextSize.ExtraLarge:
          this._computedLineHeight = lineHeights.extraLarge;
          break;
        default:
          this._computedLineHeight = lineHeights.default;
          break;
      }
    } else {
      // Looks like 1.33 is the magic number to compute line-height
      // from font size.
      this._computedLineHeight =
        this.getFontSize(
          this.hostConfig.getFontTypeDefinition(this.effectiveFontType)
        ) * 1.33;
    }

    props.style.lineHeight = `${this._computedLineHeight}px`;
  }

  getJsonTypeName(): string {
    return "TextBlock";
  }

  getEffectiveTextStyleDefinition(): TextStyleDefinition {
    if (this.style) {
      return this.hostConfig.textStyles.getStyleByName(this.style);
    }

    return super.getEffectiveTextStyleDefinition();
  }
}
