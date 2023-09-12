import type {
  AllHTMLAttributes,
  IAction,
  IActionButtonMenuItem,
} from "../core";
import { Action, Strings } from "../core";

export class OverflowAction extends Action {
  static readonly JsonTypeName: "Action.Overflow" = "Action.Overflow";

  private _actions: Action[];

  private shouldDisplayBuiltInOverflowActionMenu(): boolean {
    return this.onShouldDisplayBuiltInOverflowActionMenu
      ? this.onShouldDisplayBuiltInOverflowActionMenu(this)
      : true;
  }

  private displayOverflowActionMenu(target?: HTMLElement) {
    if (this.onDisplayOverflowActionMenu) {
      this.onDisplayOverflowActionMenu(this, target);
    }
  }

  protected getButtonMenuItems(): IActionButtonMenuItem[] | undefined {
    return this.shouldDisplayBuiltInOverflowActionMenu()
      ? this._actions.map((action: Action, index: number) => {
          return action.asMenuItem(index.toString());
        })
      : undefined;
  }

  onShouldDisplayBuiltInOverflowActionMenu?: (
    action: OverflowAction
  ) => boolean;
  onDisplayOverflowActionMenu?: (
    action: OverflowAction,
    target?: HTMLElement
  ) => void;

  constructor(actions: Action[]) {
    super();
    this._actions = actions;

    this.title = Strings.defaults.overflowButtonText();
    this.tooltip = Strings.defaults.overflowButtonTooltip();
  }

  getActions(): readonly Action[] {
    return this._actions;
  }

  getAllActions(): IAction[] {
    const result = super.getAllActions();

    result.push(...this._actions);

    return result;
  }

  getJsonTypeName(): string {
    return "Internal_Action.Overflow";
  }

  execute() {
    const shouldDisplayBuiltInOverflowActionMenu =
      this.shouldDisplayBuiltInOverflowActionMenu();

    if (!shouldDisplayBuiltInOverflowActionMenu) {
      this.displayOverflowActionMenu(this.domElement);
    }
  }

  setupElementForAccessibility(
    props: AllHTMLAttributes,
    promoteTooltipToLabel = false
  ) {
    super.setupElementForAccessibility(props, promoteTooltipToLabel);

    props["aria-label"] = Strings.defaults.overflowButtonTooltip();
  }
}
