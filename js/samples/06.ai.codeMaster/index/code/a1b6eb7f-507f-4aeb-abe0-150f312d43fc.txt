import * as React from "react";
import type {
  Action,
  AllHTMLAttributes,
  BaseSerializationContext,
  CardElement,
  IAction,
  PaddingDefinition,
  PropertyBag,
  PropertyDefinition,
  SerializableObject,
  SerializationContext,
  TypeErrorType,
  ValidationResults,
} from "../core";
import {
  CustomProperty,
  HorizontalAlignment,
  Orientation,
  SizeAndUnit,
  SizeUnit,
  Strings,
  ValidationEvent,
  Versions,
} from "../core";
import { Container, ContainerBase } from "./container";

export type ColumnWidth = SizeAndUnit | "auto" | "stretch";

export class Column extends Container {
  // #region Schema

  static readonly widthProperty = new CustomProperty<ColumnWidth>(
    Versions.v1_0,
    "width",
    (
      sender: SerializableObject,
      prop: PropertyDefinition,
      source: PropertyBag,
      context: BaseSerializationContext
    ) => {
      let result: ColumnWidth = prop.defaultValue;
      const value = source[prop.name];
      let invalidWidth = false;

      if (typeof value === "number" && !isNaN(value)) {
        result = new SizeAndUnit(value, SizeUnit.Weight);
      } else if (value === "auto" || value === "stretch") {
        result = value;
      } else if (typeof value === "string") {
        try {
          result = SizeAndUnit.parse(value);

          if (
            result.unit === SizeUnit.Pixel &&
            prop.targetVersion.compareTo(context.targetVersion) > 0
          ) {
            invalidWidth = true;
          }
        } catch (e) {
          invalidWidth = true;
        }
      } else {
        invalidWidth = true;
      }

      if (invalidWidth) {
        context.logParseEvent(
          sender,
          ValidationEvent.InvalidPropertyValue,
          Strings.errors.invalidColumnWidth(value)
        );

        result = "auto";
      }

      return result;
    },
    (
      _sender: SerializableObject,
      _property: PropertyDefinition,
      target: PropertyBag,
      value: ColumnWidth,
      context: BaseSerializationContext
    ) => {
      if (value instanceof SizeAndUnit) {
        if (value.unit === SizeUnit.Pixel) {
          context.serializeValue(target, "width", `${value.physicalSize}px`);
        } else {
          context.serializeNumber(target, "width", value.physicalSize);
        }
      } else {
        context.serializeValue(target, "width", value);
      }
    },
    "stretch"
  );

  get width(): ColumnWidth {
    return this.getValue(Column.widthProperty);
  }

  set width(value: ColumnWidth) {
    this.setValue(Column.widthProperty, value);
  }

  // #endregion

  private _computedWeight = 0;

  protected adjustSize(style: React.CSSProperties) {
    style.minWidth = "0";

    if (this.minPixelHeight) {
      style.minHeight = `${this.minPixelHeight}px`;
    }

    if (this.width === "auto") {
      style.flex = "0 1 auto";
    } else if (this.width === "stretch") {
      style.flex = "1 1 50px";
    } else if (this.width instanceof SizeAndUnit) {
      if (this.width.unit === SizeUnit.Pixel) {
        style.flex = "0 0 auto";
        style.width = `${this.width.physicalSize}px`;
      } else {
        style.flex = `1 1 ${
          this._computedWeight > 0
            ? this._computedWeight
            : this.width.physicalSize
        }%`;
      }
    }
  }

  protected shouldSerialize(_context: SerializationContext): boolean {
    return true;
  }

  protected get separatorOrientation(): Orientation {
    return Orientation.Vertical;
  }

  constructor(width: ColumnWidth = "stretch") {
    super();

    this.width = width;
  }

  getJsonTypeName(): string {
    return "Column";
  }

  get hasVisibleSeparator(): boolean {
    if (this.parent && this.parent instanceof ColumnSet) {
      return !this.parent.isLeftMostElement(this);
    }

    return false;
  }

  get isStandalone(): boolean {
    return false;
  }
}

export class ColumnSet extends ContainerBase {
  private _columns: Column[] = [];
  private _renderedColumns!: Column[];

  private createColumnInstance(
    source: any,
    context: SerializationContext
  ): Column | undefined {
    return context.parseCardObject<Column>(
      this,
      source,
      [],
      true,
      (typeName: string | undefined) => {
        return !typeName || typeName === "Column" ? new Column() : undefined;
      },
      (typeName: string, _errorType: TypeErrorType) => {
        context.logParseEvent(
          undefined,
          ValidationEvent.ElementTypeNotAllowed,
          Strings.errors.elementTypeNotAllowed(typeName)
        );
      }
    );
  }

  protected renderItems(): JSX.Element[] {
    const columnsToRender = this._columns.filter((column) =>
      column.shouldRenderForTargetWidth()
    );

    let totalWeight = 0;

    for (const column of columnsToRender) {
      if (
        column.width instanceof SizeAndUnit &&
        column.width.unit === SizeUnit.Weight
      ) {
        totalWeight += column.width.physicalSize;
      }
    }

    const renderedColumns: JSX.Element[] = [];

    this._renderedColumns = [];

    for (const column of columnsToRender) {
      if (
        column.width instanceof SizeAndUnit &&
        column.width.unit === SizeUnit.Weight &&
        totalWeight > 0
      ) {
        const computedWeight = (100 / totalWeight) * column.width.physicalSize;

        // Best way to emulate "internal" access I know of
        column["_computedWeight"] = computedWeight;
      }

      const renderedColumn = <column.Render key={column.key} />;

      if (renderedColumn) {
        renderedColumns.push(renderedColumn);

        this._renderedColumns.push(column);
      }
    }

    return renderedColumns;
  }

  protected customizeProps(props: AllHTMLAttributes) {
    super.customizeProps(props);

    props.style.display = "flex";
    props.style.flexDirection = "row";

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
  }

  protected get isSelectable(): boolean {
    return true;
  }

  protected internalParse(source: any, context: SerializationContext) {
    super.internalParse(source, context);

    this._columns = [];
    this._renderedColumns = [];

    const jsonColumns = source["columns"];

    if (Array.isArray(jsonColumns)) {
      for (const item of jsonColumns) {
        const column = this.createColumnInstance(item, context);

        if (column) {
          this._columns.push(column);
        }
      }
    }
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    super.internalToJSON(target, context);

    context.serializeArray(target, "columns", this._columns);
  }

  isFirstElement(element: CardElement): boolean {
    for (const column of this._columns) {
      if (column.isVisible) {
        return column === element;
      }
    }

    return false;
  }

  isBleedingAtTop(): boolean {
    if (this.isBleeding()) {
      return true;
    }

    if (this._renderedColumns && this._renderedColumns.length > 0) {
      for (const column of this._columns) {
        if (column.isBleedingAtTop()) {
          return true;
        }
      }
    }

    return false;
  }

  isBleedingAtBottom(): boolean {
    if (this.isBleeding()) {
      return true;
    }

    if (this._renderedColumns && this._renderedColumns.length > 0) {
      for (const column of this._columns) {
        if (column.isBleedingAtBottom()) {
          return true;
        }
      }
    }

    return false;
  }

  getItemCount(): number {
    return this._columns.length;
  }

  getFirstVisibleRenderedItem(): CardElement | undefined {
    if (this._renderedColumns && this._renderedColumns.length > 0) {
      return this._renderedColumns[0];
    } else {
      return undefined;
    }
  }

  getLastVisibleRenderedItem(): CardElement | undefined {
    if (this._renderedColumns && this._renderedColumns.length > 0) {
      return this._renderedColumns[this._renderedColumns.length - 1];
    } else {
      return undefined;
    }
  }

  getColumnAt(index: number): Column {
    return this._columns[index];
  }

  getItemAt(index: number): CardElement {
    return this.getColumnAt(index);
  }

  getJsonTypeName(): string {
    return "ColumnSet";
  }

  internalValidateProperties(context: ValidationResults) {
    super.internalValidateProperties(context);

    let weightedColumns = 0;
    let stretchedColumns = 0;

    for (const column of this._columns) {
      if (typeof column.width === "number") {
        weightedColumns++;
      } else if (column.width === "stretch") {
        stretchedColumns++;
      }
    }

    if (weightedColumns > 0 && stretchedColumns > 0) {
      context.addFailure(
        this,
        ValidationEvent.Hint,
        Strings.hints.dontUseWeightedAndStretchedColumnsInSameSet()
      );
    }
  }

  addColumn(column: Column) {
    if (!column.parent) {
      this._columns.push(column);

      column.setParent(this);
    } else {
      throw new Error(Strings.errors.columnAlreadyBelongsToAnotherSet());
    }
  }

  removeItem(item: CardElement): boolean {
    if (item instanceof Column) {
      const itemIndex = this._columns.indexOf(item);

      if (itemIndex >= 0) {
        this._columns.splice(itemIndex, 1);

        item.setParent(undefined);

        this.updateLayout();

        return true;
      }
    }

    return false;
  }

  indexOf(cardElement: CardElement): number {
    return cardElement instanceof Column
      ? this._columns.indexOf(cardElement)
      : -1;
  }

  isLeftMostElement(element: CardElement): boolean {
    return this._columns.indexOf(element as Column) === 0;
  }

  isRightMostElement(element: CardElement): boolean {
    return (
      this._columns.indexOf(element as Column) === this._columns.length - 1
    );
  }

  isTopElement(element: CardElement): boolean {
    return this._columns.indexOf(element as Column) >= 0;
  }

  isBottomElement(element: CardElement): boolean {
    return this._columns.indexOf(element as Column) >= 0;
  }

  getActionById(id: string): IAction | undefined {
    let result: IAction | undefined;

    for (const column of this._columns) {
      result = column.getActionById(id);

      if (result) {
        break;
      }
    }

    return result;
  }

  get bleed(): boolean {
    return this.getBleed();
  }

  set bleed(value: boolean) {
    this.setBleed(value);
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
}
