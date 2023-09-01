import BaseController from "./BaseController";
import Device from "sap/ui/Device";
import UI5Event from "sap/ui/base/Event";
import Component from "../Component";
import List from "sap/m/List";
import ODataListBinding from "sap/ui/model/odata/v2/ODataListBinding";
import CustomListItem from "sap/m/CustomListItem";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";

/**
 * @namespace <%= appId %>.controller
 */
export default class Master extends BaseController {
	private descendingSort = false;

	private async onListItemPress(event: UI5Event): Promise<void> {
		const replace = !Device.system.phone,
			id = (event.getSource<CustomListItem>().getBindingContext().getProperty("<%= key %>") as number),
			helper = await this.getOwnerComponent().getHelper(),
			nextUIState = helper.getNextUIState(1);
		this.getRouter().navTo("detail", { id: id, layout: nextUIState.layout },{},replace);
	}

	private onSearch(event: UI5Event) {
		const query = event.getParameter("query") as string;
		let tableSearchState:Array<Filter> = [];

		if (query && query.length > 0) {
			tableSearchState = [new Filter("Name", FilterOperator.Contains, query)];
		}

		((this.getView().byId("productsTable") as List).getBinding("items") as ODataListBinding).filter(tableSearchState, "Application");
	}

	private onSort(event: UI5Event) {
		this.descendingSort = !this.descendingSort;
		const view = this.getView(),
			table = (view.byId("productsTable") as List),
			binding = (table.getBinding("items") as ODataListBinding),
			sorter = new Sorter("Name", this.descendingSort);

		binding.sort(sorter);
	}
}