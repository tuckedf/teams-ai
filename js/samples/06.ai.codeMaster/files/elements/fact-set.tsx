import * as React from "react";
import type { FactTextDefinition, RenderArgs } from "../core";
import {
  CardElement,
  SerializableObject,
  SerializableObjectCollectionProperty,
  Spacing,
  StringProperty,
  Versions,
} from "../core";
import { compareHostWidths } from "../core/shared";
import { TextBlock } from "./text-block";

export class Fact extends SerializableObject {
  // #region Schema

  static readonly titleProperty = new StringProperty(Versions.v1_0, "title");
  static readonly valueProperty = new StringProperty(Versions.v1_0, "value");

  // For historic reasons, the "title" schema property is exposed as "name" in the OM.
  get name(): string | undefined {
    return this.getValue(Fact.titleProperty);
  }

  set name(value: string | undefined) {
    this.setValue(Fact.titleProperty, value);
  }

  get value(): string | undefined {
    return this.getValue(Fact.valueProperty);
  }

  set value(value: string | undefined) {
    this.setValue(Fact.valueProperty, value);
  }

  // #endregion

  protected getSchemaKey(): string {
    return "Fact";
  }

  constructor(name?: string, value?: string) {
    super();

    this.name = name;
    this.value = value;
  }
}

export class FactSet extends CardElement {
  // #region Schema

  static readonly factsProperty = new SerializableObjectCollectionProperty(
    Versions.v1_0,
    "facts",
    (_) => new Fact()
  );

  get facts(): Fact[] {
    return this.getValue(FactSet.factsProperty);
  }

  set facts(value: Fact[]) {
    this.setValue(FactSet.factsProperty, value);
  }

  // #endregion

  protected get useDefaultSizing(): boolean {
    return false;
  }

  protected internalRender(_args?: RenderArgs): JSX.Element | null {
    const hostConfig = this.hostConfig;

    const RenderFactText = (props: {
      value?: string;
      style: FactTextDefinition;
    }): JSX.Element => {
      const textBlock = new TextBlock();
      textBlock.setParent(this);
      textBlock.text = props.value;
      textBlock.size = props.style.size;
      textBlock.color = props.style.color;
      textBlock.isSubtle = props.style.isSubtle;
      textBlock.weight = props.style.weight;
      textBlock.wrap = props.style.wrap;
      textBlock.spacing = Spacing.None;

      return <textBlock.Render />;
    };

    if (this.facts.length > 0) {
      const singleColumnLayout =
        compareHostWidths(this.hostWidth, "standard") < 0;

      return (
        <div
          style={{
            display: "grid",
            gridAutoColumns: "auto",
            gap: this.hostConfig.factSet.spacing + "px",
          }}
        >
          {this.facts.map((fact: Fact) => {
            const renderedTitle = (
              <RenderFactText
                value={fact.name}
                style={hostConfig.factSet.title}
              />
            );

            const renderedValue = (
              <RenderFactText
                value={fact.value}
                style={hostConfig.factSet.value}
              />
            );

            const titleClassName = hostConfig.makeCssClassName("ac-fact-title");
            const valueClassName = hostConfig.makeCssClassName("ac-fact-value");

            return singleColumnLayout ? (
              <div key={fact.key}>
                <div className={titleClassName}>{renderedTitle}</div>
                <div className={valueClassName}>{renderedValue}</div>
              </div>
            ) : (
              <>
                <div
                  key={fact.key + "_title"}
                  className={titleClassName}
                  style={{
                    maxWidth: hostConfig.factSet.title.maxWidth ?? undefined,
                  }}
                >
                  {renderedTitle}
                </div>
                <div
                  key={fact.key + "_value"}
                  className={valueClassName}
                  style={{ gridColumn: 2 }}
                >
                  {renderedValue}
                </div>
              </>
            );
          })}
        </div>
      );
    }

    return null;
  }

  getJsonTypeName(): string {
    return "FactSet";
  }
}
