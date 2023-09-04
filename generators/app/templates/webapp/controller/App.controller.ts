import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";<% if (gte11170) { %>
import { Router$RouteMatchedEvent } from "sap/ui/core/routing/Router";
import { FlexibleColumnLayout$StateChangeEvent } from "sap/f/FlexibleColumnLayout";<% } else { %>
import UI5Event from "sap/ui/base/Event";<% } %>

export type inputParameters = {
	id: string;
};

/**
 * @namespace <%= appId %>.controller
 */
export default class App extends BaseController {
	private currentRouteName: string;
	private currentId: string;

	public onInit(): void {
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());<% if (gte11170) { %>
		this.getOwnerComponent().getRouter().attachRouteMatched((event: Router$RouteMatchedEvent)=>this.onRouteMatched(event), this);<% } else { %>
		this.getOwnerComponent().getRouter().attachRouteMatched((event: UI5Event)=>this.onRouteMatched(event), this);<% } %>
	}
	<% if (gte11170) { %>
	public onStateChanged(event: FlexibleColumnLayout$StateChangeEvent):void{
		const isNavigationArrow = event.getParameter("isNavigationArrow"),
		layout = event.getParameter("layout");<% } else { %>
	public onStateChanged(event: UI5Event):void{
		const isNavigationArrow =(event.getParameter("isNavigationArrow") as string),
		layout = (event.getParameter("layout") as string);<% } %>

		void this.updateUIElements();

		// Replace the URL with the new layout if a navigation arrow was used
		if (isNavigationArrow) {
			this.getOwnerComponent().getRouter().navTo(this.currentRouteName, {layout: layout, id: this.currentId},{}, true);
		}
	}
	
	<% if (gte11170) { %>
	public onRouteMatched(oEvent: Router$RouteMatchedEvent):void{
		const routeName = oEvent.getParameter("name"),
		args = (oEvent.getParameter("arguments") as inputParameters); <% } else { %>
	public onRouteMatched(oEvent: UI5Event):void{
		const routeName = (oEvent.getParameter("name") as string),
		args = (oEvent.getParameter("arguments") as inputParameters);<% } %>

		void this.updateUIElements();

		// Save the current route name
		this.currentRouteName = routeName;
		this.currentId = args.id;
	}

	private async updateUIElements() {
		const model = (this.getOwnerComponent().getModel("appView") as JSONModel),
			helper = await this.getOwnerComponent().getHelper(),
			uiState = helper.getCurrentUIState();
			model.setData(uiState);
	}

	public onExit():void{<% if (gte11170) { %>
		this.getRouter() && this.getRouter().detachRouteMatched((event: Router$RouteMatchedEvent)=>this.onRouteMatched(event), this);<% }else{ %>
		this.getRouter() && this.getRouter().detachRouteMatched((event: UI5Event)=>this.onRouteMatched(event), this);<% } %>
	}
}