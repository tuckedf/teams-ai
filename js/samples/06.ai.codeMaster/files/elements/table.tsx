import * as React from "react";
import type {
  AllHTMLAttributes,
  BaseSerializationContext,
  CardElement,
  PropertyBag,
  PropertyDefinition,
  SerializationContext,
  TextStyleDefinition,
  TypeErrorType,
} from "../core";
import {
  BoolProperty,
  CustomProperty,
  EnumProperty,
  HorizontalAlignment,
  PaddingDefinition,
  SerializableObject,
  SerializableObjectCollectionProperty,
  SizeAndUnit,
  SizeUnit,
  Spacing,
  Strings,
  stringToCssColor,
  ValidationEvent,
  Versions,
  VerticalAlignment,
} from "../core";
import {
  Container,
  ContainerStyleProperty,
  StylableCardElementContainer,
} from "./container";

export class TableColumnDefinition extends SerializableObject {
  // #region Schema

  static readonly horizontalCellContentAlignmentProperty = new EnumProperty(
    Versions.v1_5,
    "horizontalCellContentAlignment",
    HorizontalAlignment
  );
  static readonly verticalCellContentAlignmentProperty = new EnumProperty(
    Versions.v1_5,
    "verticalCellContentAlignment",
    VerticalAlignment
  );

  static readonly widthProperty = new CustomProperty<SizeAndUnit>(
    Versions.v1_5,
    "width",
    (
      sender: SerializableObject,
      prop: PropertyDefinition,
      source: PropertyBag,
      context: BaseSerializationContext
    ) => {
      let result: SizeAndUnit = prop.defaultValue;
      const value = source[prop.name];
      let invalidWidth = false;

      if (typeof value === "number" && !isNaN(value)) {
        result = new SizeAndUnit(value, SizeUnit.Weight);
      } else if (typeof value === "string") {
        try {
          result = SizeAndUnit.parse(value);
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
      }

      return result;
    },
    (
      _sender: SerializableObject,
      _property: PropertyDefinition,
      target: PropertyBag,
      value: SizeAndUnit,
      context: BaseSerializationContext
    ) => {
      if (value.unit === SizeUnit.Pixel) {
        context.serializeValue(target, "width", `${value.physicalSize}px`);
      } else {
        context.serializeNumber(target, "width", value.physicalSize);
      }
    },
    new SizeAndUnit(1, SizeUnit.Weight)
  );

  get horizontalCellContentAlignment(): HorizontalAlignment | undefined {
    return this.getValue(
      TableColumnDefinition.horizontalCellContentAlignmentProperty
    );
  }

  set horizontalCellContentAlignment(value: HorizontalAlignment | undefined) {
    this.setValue(
      TableColumnDefinition.horizontalCellContentAlignmentProperty,
      value
    );
  }

  get verticalCellContentAlignment(): VerticalAlignment | undefined {
    return this.getValue(
      TableColumnDefinition.verticalCellContentAlignmentProperty
    );
  }

  set verticalCellContentAlignment(value: VerticalAlignment | undefined) {
    this.setValue(
      TableColumnDefinition.verticalCellContentAlignmentProperty,
      value
    );
  }

  get width(): SizeAndUnit {
    return this.getValue(TableColumnDefinition.widthProperty);
  }

  set width(value: SizeAndUnit) {
    this.setValue(TableColumnDefinition.widthProperty, value);
  }

  getSchemaKey(): string {
    return "ColumnDefinition";
  }

  // #endregion

  computedWidth!: SizeAndUnit;
}

export abstract class StylableContainer<
  T extends CardElement
> extends StylableCardElementContainer {
  private _items: T[] = [];

  private parseItem(source: any, context: SerializationContext): T | undefined {
    return context.parseCardObject<T>(
      this,
      source,
      [], // Forbidden types not supported for elements for now
      true,
      (typeName: string) => {
        return this.createItemInstance(typeName);
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

  protected abstract getCollectionPropertyName(): string;
  protected abstract createItemInstance(typeName: string): T | undefined;

  protected internalAddItem(item: T) {
    if (!item.parent) {
      this._items.push(item);

      item.setParent(this);
    } else {
      throw new Error(Strings.errors.elementAlreadyParented());
    }
  }

  protected internalRemoveItem(item: T): boolean {
    const itemIndex = this._items.indexOf(item);

    if (itemIndex >= 0) {
      this._items.splice(itemIndex, 1);

      item.setParent(undefined);

      this.updateLayout();

      return true;
    }

    return false;
  }

  protected internalIndexOf(item: T): number {
    return this._items.indexOf(item);
  }

  protected internalParse(source: any, context: SerializationContext) {
    super.internalParse(source, context);

    this._items = [];

    const items = source[this.getCollectionPropertyName()];

    if (Array.isArray(items)) {
      for (const item of items) {
        const instance = this.parseItem(item, context);

        if (instance) {
          this._items.push(instance);
        }
      }
    }
  }

  protected internalToJSON(target: PropertyBag, context: SerializationContext) {
    super.internalToJSON(target, context);

    context.serializeArray(
      target,
      this.getCollectionPropertyName(),
      this._items
    );
  }

  removeItem(item: T): boolean {
    return this.internalRemoveItem(item);
  }

  getItemCount(): number {
    return this._items.length;
  }

  getItemAt(index: number): T {
    return this._items[index];
  }

  getFirstVisibleRenderedItem(): T | undefined {
    return this.getItemCount() > 0 ? this.getItemAt(0) : undefined;
  }

  getLastVisibleRenderedItem(): T | undefined {
    return this.getItemCount() > 0
      ? this.getItemAt(this.getItemCount() - 1)
      : undefined;
  }
}

export type CellType = "data" | "header";

export class TableCell extends Container {
  private _columnIndex = -1;
  private _cellType: CellType = "data";

  protected getHasBorder(): boolean {
    return this.parentRow.parentTable.showGridLines;
  }

  protected applyBorder(props: AllHTMLAttributes) {
    if (this.getHasBorder()) {
      const styleDefinition = this.hostConfig.containerStyles.getStyleByName(
        this.parentRow.parentTable.gridStyle
      );

      if (styleDefinition.borderColor) {
        const borderColor = stringToCssColor(styleDefinition.borderColor);

        if (borderColor) {
          props.style.borderRight = `1px solid ${borderColor}`;
          props.style.borderBottom = `1px solid ${borderColor}`;
        }
      }
    }
  }

  protected getDefaultPadding(): PaddingDefinition {
    return this.getHasBackground() || this.getHasBorder()
      ? new PaddingDefinition(
          Spacing.Small,
          Spacing.Small,
          Spacing.Small,
          Spacing.Small
        )
      : super.getDefaultPadding();
  }

  protected adjustSize(style: React.CSSProperties) {
    const column = this.parentRow.parentTable.getColumnAt(this.columnIndex);

    if (column.computedWidth.unit === SizeUnit.Pixel) {
      style.flex = `0 0 ${column.computedWidth.physicalSize}px`;
    } else {
      style.flex = `1 1 ${column.computedWidth.physicalSize}%`;
    }
  }

  protected customizeProps(props: AllHTMLAttributes) {
    super.customizeProps(props);

    props.role = this.cellType === "data" ? "cell" : "columnheader";
    props.style.minWidth = 0;

    if (this.cellType === "header") {
      props.scope = "col";
    }
  }

  protected shouldSerialize(_context: SerializationContext): boolean {
    return true;
  }

  getJsonTypeName(): string {
    return "TableCell";
  }

  getEffectiveTextStyleDefinition(): TextStyleDefinition {
    if (this.cellType === "header") {
      return this.hostConfig.textStyles.columnHeader;
    }

    return super.getEffectiveTextStyleDefinition();
  }

  getEffectiveHorizontalAlignment(): HorizontalAlignment {
    if (this.horizontalAlignment !== undefined) {
      return this.horizontalAlignment;
    }

    if (this.parentRow.horizontalCellContentAlignment !== undefined) {
      return this.parentRow.horizontalCellContentAlignment;
    }

    if (this.columnIndex >= 0) {
      const horizontalAlignment = this.parentRow.parentTable.getColumnAt(
        this.columnIndex
      ).horizontalCellContentAlignment;

      if (horizontalAlignment !== undefined) {
        return horizontalAlignment;
      }
    }

    if (
      this.parentRow.parentTable.horizontalCellContentAlignment !== undefined
    ) {
      return this.parentRow.parentTable.horizontalCellContentAlignment;
    }

    return super.getEffectiveHorizontalAlignment();
  }

  getEffectiveVerticalContentAlignment(): VerticalAlignment {
    if (this.verticalContentAlignment !== undefined) {
      return this.verticalContentAlignment;
    }

    if (this.parentRow.verticalCellContentAlignment !== undefined) {
      return this.parentRow.verticalCellContentAlignment;
    }

    if (this.columnIndex >= 0) {
      const verticalAlignment = this.parentRow.parentTable.getColumnAt(
        this.columnIndex
      ).verticalCellContentAlignment;

      if (verticalAlignment !== undefined) {
        return verticalAlignment;
      }
    }

    if (this.parentRow.parentTable.verticalCellContentAlignment !== undefined) {
      return this.parentRow.parentTable.verticalCellContentAlignment;
    }

    return super.getEffectiveVerticalContentAlignment();
  }

  get columnIndex(): number {
    return this._columnIndex;
  }

  get cellType(): CellType {
    return this._cellType;
  }

  get parentRow(): TableRow {
    return this.parent as TableRow;
  }

  get isStandalone(): boolean {
    return false;
  }
}

export class TableRow extends StylableContainer<TableCell> {
  // #region Schema

  static readonly styleProperty = new ContainerStyleProperty(
    Versions.v1_5,
    "style"
  );
  static readonly horizontalCellContentAlignmentProperty = new EnumProperty(
    Versions.v1_5,
    "horizontalCellContentAlignment",
    HorizontalAlignment
  );
  static readonly verticalCellContentAlignmentProperty = new EnumProperty(
    Versions.v1_5,
    "verticalCellContentAlignment",
    VerticalAlignment
  );

  get horizontalCellContentAlignment(): HorizontalAlignment | undefined {
    return this.getValue(TableRow.horizontalCellContentAlignmentProperty);
  }

  set horizontalCellContentAlignment(value: HorizontalAlignment | undefined) {
    this.setValue(TableRow.horizontalCellContentAlignmentProperty, value);
  }

  get verticalCellContentAlignment(): VerticalAlignment | undefined {
    return this.getValue(TableRow.verticalCellContentAlignmentProperty);
  }

  set verticalCellContentAlignment(value: VerticalAlignment | undefined) {
    this.setValue(TableRow.verticalCellContentAlignmentProperty, value);
  }

  // #endregion

  protected getDefaultPadding(): PaddingDefinition {
    return new PaddingDefinition(
      Spacing.None,
      Spacing.None,
      Spacing.None,
      Spacing.None
    );
  }

  protected applyBackground(props: AllHTMLAttributes) {
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

  protected getCollectionPropertyName(): string {
    return "cells";
  }

  protected createItemInstance(typeName: string): TableCell | undefined {
    return !typeName || typeName === "TableCell" ? new TableCell() : undefined;
  }

  protected renderItems(): JSX.Element[] {
    const renderedCells: JSX.Element[] = [];
    const isFirstRow = this.getIsFirstRow();

    for (
      let i = 0;
      i < Math.min(this.getItemCount(), this.parentTable.getColumnCount());
      i++
    ) {
      const cell = this.getItemAt(i);

      // Cheating a bit in order to keep cellType read-only
      cell["_columnIndex"] = i;
      cell["_cellType"] =
        this.parentTable.firstRowAsHeaders && isFirstRow ? "header" : "data";

      const renderedCell = <cell.Render key={cell.key} />;

      if (renderedCell) {
        renderedCells.push(renderedCell);
      }
    }

    return renderedCells;
  }

  protected customizeProps(props: AllHTMLAttributes) {
    props.role = "row";
    props.style.display = "flex";
    props.style.flexDirection = "row";

    const cellSpacing = this.hostConfig.table.cellSpacing;

    if (!this.parentTable.showGridLines && cellSpacing > 0) {
      props.style.gap = cellSpacing;
    }
  }

  protected shouldSerialize(_context: SerializationContext): boolean {
    return true;
  }

  addCell(cell: TableCell) {
    this.internalAddItem(cell);
  }

  removeCellAt(columnIndex: number): boolean {
    if (columnIndex >= 0 && columnIndex < this.getItemCount()) {
      return this.removeItem(this.getItemAt(columnIndex));
    }

    return false;
  }

  indexOf(cardElement: CardElement): number {
    return cardElement instanceof TableCell
      ? this.internalIndexOf(cardElement)
      : -1;
  }

  ensureHasEnoughCells(cellCount: number) {
    while (this.getItemCount() < cellCount) {
      this.addCell(new TableCell());
    }
  }

  getJsonTypeName(): string {
    return "TableRow";
  }

  getIsFirstRow(): boolean {
    return this.parentTable.getItemAt(0) === this;
  }

  get parentTable(): Table {
    return this.parent as Table;
  }

  get isStandalone(): boolean {
    return false;
  }
}

export class Table extends StylableContainer<TableRow> {
  // #region Schema

  private static readonly _columnsProperty =
    new SerializableObjectCollectionProperty(
      Versions.v1_5,
      "columns",
      (_) => new TableColumnDefinition()
    );

  static readonly firstRowAsHeadersProperty = new BoolProperty(
    Versions.v1_5,
    "firstRowAsHeaders",
    true
  );
  static readonly showGridLinesProperty = new BoolProperty(
    Versions.v1_5,
    "showGridLines",
    true
  );
  static readonly gridStyleProperty = new ContainerStyleProperty(
    Versions.v1_5,
    "gridStyle"
  );
  static readonly horizontalCellContentAlignmentProperty = new EnumProperty(
    Versions.v1_5,
    "horizontalCellContentAlignment",
    HorizontalAlignment
  );
  static readonly verticalCellContentAlignmentProperty = new EnumProperty(
    Versions.v1_5,
    "verticalCellContentAlignment",
    VerticalAlignment
  );

  private get _columns(): TableColumnDefinition[] {
    return this.getValue(Table._columnsProperty);
  }

  private set _columns(value: TableColumnDefinition[]) {
    this.setValue(Table._columnsProperty, value);
  }

  get firstRowAsHeaders(): boolean {
    return this.getValue(Table.firstRowAsHeadersProperty);
  }

  set firstRowAsHeaders(value: boolean) {
    this.setValue(Table.firstRowAsHeadersProperty, value);
  }

  get showGridLines(): boolean {
    return this.getValue(Table.showGridLinesProperty);
  }

  set showGridLines(value: boolean) {
    this.setValue(Table.showGridLinesProperty, value);
  }

  get gridStyle(): string | undefined {
    const style = this.getValue(Table.gridStyleProperty);

    if (style && this.hostConfig.containerStyles.getStyleByName(style)) {
      return style;
    }

    return undefined;
  }

  set gridStyle(value: string | undefined) {
    this.setValue(Table.gridStyleProperty, value);
  }

  get horizontalCellContentAlignment(): HorizontalAlignment | undefined {
    return this.getValue(Table.horizontalCellContentAlignmentProperty);
  }

  set horizontalCellContentAlignment(value: HorizontalAlignment | undefined) {
    this.setValue(Table.horizontalCellContentAlignmentProperty, value);
  }

  get verticalCellContentAlignment(): VerticalAlignment | undefined {
    return this.getValue(Table.verticalCellContentAlignmentProperty);
  }

  set verticalCellContentAlignment(value: VerticalAlignment | undefined) {
    this.setValue(Table.verticalCellContentAlignmentProperty, value);
  }

  // #endregion

  private ensureRowsHaveEnoughCells() {
    for (let i = 0; i < this.getItemCount(); i++) {
      this.getItemAt(i).ensureHasEnoughCells(this.getColumnCount());
    }
  }

  private removeCellsFromColumn(columnIndex: number) {
    for (let i = 0; i < this.getItemCount(); i++) {
      this.getItemAt(i).removeCellAt(columnIndex);
    }
  }

  protected getCollectionPropertyName(): string {
    return "rows";
  }

  protected createItemInstance(typeName: string): TableRow | undefined {
    return !typeName || typeName === "TableRow" ? new TableRow() : undefined;
  }

  protected internalParse(source: PropertyBag, context: SerializationContext) {
    super.internalParse(source, context);

    this.ensureRowsHaveEnoughCells();
  }

  protected renderItems(): JSX.Element[] {
    const renderedRows: JSX.Element[] = [];

    for (let i = 0; i < this.getItemCount(); i++) {
      const item = this.getItemAt(i);
      const renderedRow = <item.Render key={item.key} />;

      if (renderedRow) {
        renderedRows.push(renderedRow);
      }
    }

    return renderedRows;
  }

  protected customizeProps(props: AllHTMLAttributes) {
    let totalWeights = 0;

    for (const column of this._columns) {
      if (column.width.unit === SizeUnit.Weight) {
        totalWeights += column.width.physicalSize;
      }
    }

    for (const column of this._columns) {
      if (column.width.unit === SizeUnit.Pixel) {
        column.computedWidth = new SizeAndUnit(
          column.width.physicalSize,
          SizeUnit.Pixel
        );
      } else {
        column.computedWidth = new SizeAndUnit(
          (100 / totalWeights) * column.width.physicalSize,
          SizeUnit.Weight
        );
      }
    }

    const cellSpacing = this.hostConfig.table.cellSpacing;

    props.role = "table";
    props.style.display = "flex";
    props.style.flexDirection = "column";

    if (!this.showGridLines) {
      props.style.gap = cellSpacing > 0 ? cellSpacing : undefined;
    } else {
      const styleDefinition = this.hostConfig.containerStyles.getStyleByName(
        this.gridStyle
      );

      if (styleDefinition.borderColor) {
        const borderColor = stringToCssColor(styleDefinition.borderColor);

        if (borderColor) {
          props.style.borderTop = `1px solid ${borderColor}`;
          props.style.borderLeft = `1px solid ${borderColor}`;
        }
      }
    }
  }

  addColumn(column: TableColumnDefinition) {
    this._columns.push(column);

    this.ensureRowsHaveEnoughCells();
  }

  removeColumn(column: TableColumnDefinition) {
    const index = this._columns.indexOf(column);

    if (index >= 0) {
      this.removeCellsFromColumn(index);

      this._columns.splice(index, 1);
    }
  }

  getColumnCount(): number {
    return this._columns.length;
  }

  getColumnAt(index: number): TableColumnDefinition {
    return this._columns[index];
  }

  addRow(row: TableRow) {
    this.internalAddItem(row);

    row.ensureHasEnoughCells(this.getColumnCount());
  }

  indexOf(cardElement: CardElement): number {
    return cardElement instanceof TableRow
      ? this.internalIndexOf(cardElement)
      : -1;
  }

  getJsonTypeName(): string {
    return "Table";
  }
}
