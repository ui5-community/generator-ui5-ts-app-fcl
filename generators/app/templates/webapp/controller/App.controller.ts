import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import UI5Event from "sap/ui/base/Event";

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
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		this.getOwnerComponent().getRouter().attachRouteMatched((event: UI5Event)=>this.onRouteMatched(event), this);
	}

	public onStateChanged(oEvent: UI5Event):void{
		const bIsNavigationArrow =(oEvent.getParameter("isNavigationArrow") as string),
			sLayout = (oEvent.getParameter("layout") as string);

		void this.updateUIElements();

		// Replace the URL with the new layout if a navigation arrow was used
		if (bIsNavigationArrow) {
			this.getOwnerComponent().getRouter().navTo(this.currentRouteName, {layout: sLayout, id: this.currentId},{}, true);
		}
	}
	
	public onRouteMatched(oEvent: UI5Event):void{
		const sRouteName = (oEvent.getParameter("name") as string),
			oArguments = (oEvent.getParameter("arguments") as inputParameters);

		void this.updateUIElements();

		// Save the current route name
		this.currentRouteName = sRouteName;
		this.currentId = oArguments.id;
	}

	private async updateUIElements() {
		const oModel = (this.getOwnerComponent().getModel("appView") as JSONModel),
			helper = await this.getOwnerComponent().getHelper(),
			oUIState = helper.getCurrentUIState();
		oModel.setData(oUIState);
	}

	public onExit():void{
		this.getRouter() && this.getRouter().detachRouteMatched((event: UI5Event)=>this.onRouteMatched(event), this);
	}
}