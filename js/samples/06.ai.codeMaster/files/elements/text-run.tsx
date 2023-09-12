import * as React from "react";
import type {
  AllHTMLAttributes,
  RenderArgs,
  SerializableObjectSchema,
} from "../core";
import {
  BoolProperty,
  createProps,
  formatText,
  stringToCssColor,
  Versions,
} from "../core";
import { BaseTextBlock } from "./text-block";

export class TextRun extends BaseTextBlock {
  // #region Schema

  static readonly italicProperty = new BoolProperty(
    Versions.v1_2,
    "italic",
    false
  );
  static readonly strikethroughProperty = new BoolProperty(
    Versions.v1_2,
    "strikethrough",
    false
  );
  static readonly highlightProperty = new BoolProperty(
    Versions.v1_2,
    "highlight",
    false
  );
  static readonly underlineProperty = new BoolProperty(
    Versions.v1_3,
    "underline",
    false
  );

  protected populateSchema(schema: SerializableObjectSchema) {
    super.populateSchema(schema);

    schema.add(BaseTextBlock.selectActionProperty);
  }

  get italic(): boolean {
    return this.getValue(TextRun.italicProperty);
  }

  set italic(value: boolean) {
    this.setValue(TextRun.italicProperty, value);
  }

  get strikethrough(): boolean {
    return this.getValue(TextRun.strikethroughProperty);
  }

  set strikethrough(value: boolean) {
    this.setValue(TextRun.strikethroughProperty, value);
  }

  get highlight(): boolean {
    return this.getValue(TextRun.highlightProperty);
  }

  set highlight(value: boolean) {
    this.setValue(TextRun.highlightProperty, value);
  }

  get underline(): boolean {
    return this.getValue(TextRun.underlineProperty);
  }

  set underline(value: boolean) {
    this.setValue(TextRun.underlineProperty, value);
  }

  // #endregion

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    if (this.text) {
      const preProcessedText = this.preProcessPropertyValue(
        BaseTextBlock.textProperty
      );
      const hostConfig = this.hostConfig;

      const formattedText = formatText(this.lang, preProcessedText);

      let content: JSX.Element | string = formattedText ?? "";

      if (this.selectAction && hostConfig.supportsInteractivity) {
        const anchorProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
          style: {},
        };
        anchorProps.className = hostConfig.makeCssClassName("ac-anchor");
        anchorProps.href = this.selectAction.getHref();
        anchorProps.target = "_blank";
        anchorProps.rel = "noopener noreferrer";
        anchorProps.onClick = (e) => {
          if (this.selectAction && this.selectAction.isEffectivelyEnabled()) {
            e.preventDefault();
            e.stopPropagation();

            this.selectAction.execute();
          }
        };

        this.selectAction.setupElementForAccessibility(anchorProps);

        const renderedAnchor = this.renderAnchor(formattedText, anchorProps);

        if (renderedAnchor !== null) {
          content = renderedAnchor;
        }
      }

      const props = createProps();
      props.className = hostConfig.makeCssClassName("ac-textRun");
      props.style.whiteSpace = "pre-wrap";

      this.applyStylesTo(props);

      return React.createElement("span", props, content);
    }

    return null;
  }

  applyStylesTo(props: AllHTMLAttributes) {
    super.applyStylesTo(props);

    if (this.italic) {
      props.style.fontStyle = "italic";
    }

    if (this.strikethrough) {
      props.style.textDecoration = "line-through";
    }

    if (this.highlight) {
      const colorDefinition = this.getColorDefinition(
        this.getEffectiveStyleDefinition().foregroundColors,
        this.effectiveColor
      );

      const backgroundColor = stringToCssColor(
        this.effectiveIsSubtle
          ? colorDefinition.highlightColors.subtle
          : colorDefinition.highlightColors.default
      );
      if (backgroundColor) {
        props.style.backgroundColor = backgroundColor;
      }
    }

    if (this.underline) {
      props.style.textDecoration = "underline";
    }
  }

  getJsonTypeName(): string {
    return "TextRun";
  }

  get isStandalone(): boolean {
    return false;
  }

  get isInline(): boolean {
    return true;
  }
}
