import * as React from "react";
import type { PropertyBag, RenderArgs, SerializationContext } from "../core";
import {
  CardElement,
  createProps,
  HorizontalAlignment,
  Strings,
} from "../core";
import { TextRun } from "./text-run";

export class RichTextBlock extends CardElement {
  private _inlines: CardElement[] = [];

  private internalAddInline(inline: CardElement, forceAdd = false) {
    if (!inline.isInline) {
      throw new Error(Strings.errors.elementCannotBeUsedAsInline());
    }

    const doAdd: boolean = inline.parent === undefined || forceAdd;

    if (!doAdd && inline.parent !== this) {
      throw new Error(Strings.errors.inlineAlreadyParented());
    } else {
      inline.setParent(this);

      this._inlines.push(inline);
    }
  }

  protected internalParse(source: any, context: SerializationContext) {
    super.internalParse(source, context);

    this._inlines = [];

    if (Array.isArray(source["inlines"])) {
      for (const jsonInline of source["inlines"]) {
        let inline: CardElement | undefined;

        if (typeof jsonInline === "string") {
          const textRun = new TextRun();
          textRun.text = jsonInline;

          inline = textRun;
        } else {
          // No fallback for inlines in 1.2
          inline = context.parseElement(this, jsonInline, [], false);
        }

        if (inline) {
          this.internalAddInline(inline, true);
        }
      }
    }
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    super.internalToJSON(target, context);

    if (this._inlines.length > 0) {
      const jsonInlines: any[] = [];

      for (const inline of this._inlines) {
        jsonInlines.push(inline.toJSON(context));
      }

      context.serializeValue(target, "inlines", jsonInlines);
    }
  }

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    if (this._inlines.length > 0) {
      const props = createProps();
      props.id = this.id;
      props.htmlFor = this.forElementId;
      props.className = this.hostConfig.makeCssClassName("ac-richTextBlock");

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

      const renderedInlines = this._inlines.map((inline) => (
        <inline.Render key={inline.key} />
      ));

      if (renderedInlines.length > 0) {
        return React.createElement(
          this.forElementId ? "label" : "div",
          props,
          renderedInlines
        );
      }
    }

    return null;
  }

  forElementId?: string;

  asString(): string | undefined {
    let result = "";

    for (const inline of this._inlines) {
      result += inline.asString();
    }

    return result;
  }

  getJsonTypeName(): string {
    return "RichTextBlock";
  }

  getInlineCount(): number {
    return this._inlines.length;
  }

  getInlineAt(index: number): CardElement {
    if (index >= 0 && index < this._inlines.length) {
      return this._inlines[index];
    } else {
      throw new Error(Strings.errors.indexOutOfRange(index));
    }
  }

  addInline(inline: CardElement | string) {
    if (typeof inline === "string") {
      this.internalAddInline(new TextRun(inline));
    } else {
      this.internalAddInline(inline);
    }
  }

  removeInline(inline: CardElement): boolean {
    const index = this._inlines.indexOf(inline);

    if (index >= 0) {
      this._inlines[index].setParent(undefined);
      this._inlines.splice(index, 1);

      return true;
    }

    return false;
  }
}
