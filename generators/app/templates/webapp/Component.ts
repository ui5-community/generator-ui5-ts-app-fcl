import UIComponent from "sap/ui/core/UIComponent";
import models from "./model/models";
import FlexibleColumnLayoutSemanticHelper from "sap/f/FlexibleColumnLayoutSemanticHelper";
import { LayoutType } from "sap/f/library";
import FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import JSONModel from "sap/ui/model/json/JSONModel";<% if (gte11150) { %>
import View, { View$AfterInitEvent } from "sap/ui/core/mvc/View";
import { Router$BeforeRouteMatchedEvent } from "sap/ui/core/routing/Router";<% } else { %>
import UI5Event from "sap/ui/base/Event";
import View from "sap/ui/core/mvc/View"; <% } %>
import ErrorHandler from "./controller/ErrorHandler";<% if (gte11150) { %>
import Device from "sap/ui/Device";<% } else { %>
import * as Device from "sap/ui/Device"; // for UI5 >= 1.115.0 use: import Device from "sap/ui/Device";<% } %>

<% if (!gte11130) { %>
export type UIState = {
	"layout": string;
	"maxColumnsCount": number;
	"columnsSizes": {
		"beginColumn": number;
		"midColumn": number;
		"endColumn": number;
	},
	"columnsVisibility": {
		"beginColumn": boolean;
		"midColumn": boolean;
		"endColumn": boolean;
	},
	"isFullScreen": boolean;
	"isLogicallyFullScreen": boolean;
	"actionButtonsInfo": {
		"midColumn": {
			"fullScreen": string;
			"exitFullScreen": string;
			"closeColumn": string;
		},
		"endColumn": {
			"fullScreen": string;
			"exitFullScreen": string;
			"closeColumn": string;
		}
	}
}
<% } %>
type routeParameters = {
	arguments: {
		layout: string;
	}
};

/**
 * @namespace <%= appId %>
 */
export default class Component extends UIComponent {
	private contentDensityClass: string | undefined;
	private errorHandler: ErrorHandler;

	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"]
	};

	public init(): void {
		this.errorHandler = new ErrorHandler(this);
		super.init();
		this.setModel(models.createDeviceModel(), "device");
		this.setModel(new JSONModel(), "appView");<% if (gte11150) { %>
		this.getRouter().attachBeforeRouteMatched((event: Router$BeforeRouteMatchedEvent) => void this.onBeforeRouteMatched(event), this);<% } else { %>
		this.getRouter().attachBeforeRouteMatched((event: UI5Event) => this.onBeforeRouteMatched(event), this);<% } %>
		this.getRouter().initialize();
	}

	public destroy(): void {<% if (gte11150) { %>
		this.getRouter().detachBeforeRouteMatched((event: Router$BeforeRouteMatchedEvent) => void this.onBeforeRouteMatched(event), this);<% } else { %>
		this.getRouter().detachBeforeRouteMatched((event: UI5Event) => this.onBeforeRouteMatched(event), this);<% } %>
		super.destroy();
	}

	public getContentDensityClass(): string {
		if (this.contentDensityClass === undefined) {
			// check whether FLP has already set the content density class; do nothing in this case
			// eslint-disable-next-line
			if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
				this.contentDensityClass = "";
			} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
				this.contentDensityClass = "sapUiSizeCompact";
			} else {
				// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
				this.contentDensityClass = "sapUiSizeCozy";
			}
		}
		return this.contentDensityClass;
	}
	<% if (gte11150) { %>
	private async onBeforeRouteMatched(oEvent: Router$BeforeRouteMatchedEvent) {<% } else { %>
	private async onBeforeRouteMatched(oEvent: UI5Event) {<% } %>
		const model = (this.getModel("appView") as JSONModel),
			layout = (oEvent.getParameters() as routeParameters).arguments.layout;

		// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
		if (!layout) {
			const helper = await this.getHelper() ;<% if (gte11130){ %>
			const nextUIState = helper.getNextUIState(0);<% } else { %>
			const nextUIState = helper.getNextUIState(0) as UIState;<% } %>
			model.setProperty("/layout", nextUIState.layout);
			return;
		}

		model.setProperty("/layout", layout);
	}

	public async getHelper(): Promise<FlexibleColumnLayoutSemanticHelper> {
		const fcl = await this.getFcl(),
			settings = {
				defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
				defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded
			};
		return (FlexibleColumnLayoutSemanticHelper.getInstanceFor(fcl, settings));
	}

	private getFcl(): Promise<FlexibleColumnLayout> {
		return new Promise((resolve, reject) => {
			const FCL = ((this.getRootControl() as View).byId('fcl') as FlexibleColumnLayout);
			if (!FCL) {<% if (gte11170) { %>
				(this.getRootControl() as View).attachAfterInit((event: View$AfterInitEvent) => {
					resolve((event.getSource().byId('fcl') as FlexibleColumnLayout));<% } else if (gte11150) { %>
				(this.getRootControl() as View).attachAfterInit((event: View$AfterInitEvent) => {
					resolve(((event.getSource() as View).byId('fcl') as FlexibleColumnLayout)); <% } else { %>
				(this.getRootControl() as View).attachAfterInit((event: UI5Event) => {
					resolve(((event.getSource() as View).byId('fcl') as FlexibleColumnLayout)); <% } %>
				});
				return;
			}
			resolve(FCL);
		});
	}
}
