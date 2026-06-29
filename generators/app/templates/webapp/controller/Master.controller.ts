import BaseController from "./BaseController";
import List from "sap/m/List";
import ODataListBinding from "sap/ui/model/odata/v2/ODataListBinding";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";<% if (gte11150) { %>
import Device from "sap/ui/Device";<% } else { %>
import * as Device from "sap/ui/Device"; // for UI5 >= 1.115.0 use: import Device from "sap/ui/Device";<% } %><% if (gte11150) { %>
import { ListItemBase$PressEvent } from "sap/m/ListItemBase";
import { SearchField$SearchEvent } from "sap/m/SearchField";<% } else { %>
import UI5Event from "sap/ui/base/Event";<% } %>
<% if (!gte11130){ %>import { UIState } from "../Component";<% } %>
<% if (!gte11170){ %>import CustomListItem from "sap/m/CustomListItem";<% } %>

/**
 * @namespace <%= appId %>.controller
 */
export default class Master extends BaseController {
	private descendingSort = false;
	<% if (gte11170) { %>
	private async onListItemPress(event: ListItemBase$PressEvent): Promise<void> {
		const replace = !Device.system.phone,
			id = (event.getSource().getBindingContext().getProperty("<%= key %>") as number),<% } else if (gte11150) { %>
	private async onListItemPress(event: ListItemBase$PressEvent): Promise<void> {
		const replace = !Device.system.phone,
			id = ((event.getSource() as CustomListItem).getBindingContext().getProperty("<%= key %>") as number),<% } else { %>
	private async onListItemPress(event: UI5Event): Promise<void> {
		const replace = !Device.system.phone,
			id = ((event.getSource() as CustomListItem).getBindingContext().getProperty("<%= key %>") as number), // for UI5 >= 1.117.0 <% } %>
			helper = await this.getOwnerComponent().getHelper(),<% if (gte11130){ %>
			nextUIState = helper.getNextUIState(1);<% } else { %>
			nextUIState = helper.getNextUIState(1) as UIState;<% } %>
		this.getRouter().navTo("detail", { id: id, layout: nextUIState.layout },{},replace);
	}
	<% if (gte11150) { %>
	private onSearch(event: SearchField$SearchEvent) {
		const query = event.getParameter("query");<% } else { %>
	private onSearch(event: UI5Event) {
		const query = event.getParameter("query") as string;<% } %>
		let tableSearchState:Array<Filter> = [];

		if (query && query.length > 0) {
			tableSearchState = [new Filter("Name", FilterOperator.Contains, query)];
		}

		((this.getView().byId("productsTable") as List).getBinding("items") as ODataListBinding).filter(tableSearchState, "Application");
	}

	private onSort() {
		this.descendingSort = !this.descendingSort;
		const view = this.getView(),
			table = (view.byId("productsTable") as List),
			binding = (table.getBinding("items") as ODataListBinding),
			sorter = new Sorter("Name", this.descendingSort);

		binding.sort(sorter);
	}
}