import UI5Object from "sap/ui/base/Object";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import UIComponent from "sap/ui/core/UIComponent";
import AppComponent from "../Component";
import ResourceModel from "sap/ui/model/resource/ResourceModel";<% if (gte11150) { %>
import ODataModel, { ODataModel$MetadataFailedEvent, ODataModel$RequestFailedEvent } from "sap/ui/model/odata/v2/ODataModel";
import MessageBox from "sap/m/MessageBox";<% } else { %>
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import UI5Event from "sap/ui/base/Event";
import MessageBox, { Action } from "sap/m/MessageBox";<% } %>

type ui5Response = {
	/**
	 * A text that describes the failure.
	 */
	message?: string;
	/**
	 * HTTP status code returned by the request (if available)
	 */
	statusCode?: string;
	/**
	 * The status as a text, details not specified, intended only for diagnosis output
	 */
	statusText?: string;
	/**
	 * Response that has been received for the request ,as a text string
	 */
	responseText?: string;
};

/**
 * @namespace <%= appId %>.controller
 */
export default class ErrorHandler extends UI5Object {
	private resourceBundle: ResourceBundle;
	private component: AppComponent;
	private model: ODataModel;
	private messageOpen: boolean;
	private errorText: string;

	constructor(component: UIComponent) {
		super();

		this.component = (component as AppComponent);
		this.model = (component.getModel() as ODataModel);
		this.messageOpen = false;
		<% if (gte11150) { %>
		this.model.attachMetadataFailed((event: ODataModel$MetadataFailedEvent) => {<% }else{ %>
		this.model.attachMetadataFailed((event: UI5Event) => {<% } %>
			const responseText = (event.getParameter("response") as ui5Response);
			void this.showServiceError(responseText);
		});<% if (gte11150) { %>
		this.model.attachRequestFailed((event: ODataModel$RequestFailedEvent) => {<% }else{ %>
		this.model.attachRequestFailed((event: UI5Event) => {<% } %>
			const response = (event.getParameter("response") as ui5Response);
			// An entity that was not found in the service is also throwing a 404 error in oData.
			// We already cover this case with a notFound target so we skip it here.
			// A request that cannot be sent to the server is a technical error that we have to handle though
			if (response.statusCode !== "404" || (response.statusCode == "404" && response.responseText.indexOf("Cannot POST") === 0)) {
				void this.showServiceError(response);
			}
		});
	}

	/**
	 * Shows a {@link sap.m.MessageBox} when a service call has failed.
	 * Only the first error message will be display.
	 * @param {string} sDetails a technical error to be displayed on request
	 * @private
	 */
	private async showServiceError(details: ui5Response) {
		if (this.messageOpen) {
			return;
		}
		this.messageOpen = true;
		let responseText:any;

		if(!this.errorText){
			this.resourceBundle = await ((this.component.getModel("i18n") as ResourceModel).getResourceBundle() as Promise<ResourceBundle>);
			this.errorText = this.resourceBundle.getText("errorText");
		}

		if(details.responseText){
			try{
				responseText = (JSON.parse(details.responseText) as unknown);
			}catch(ex){
				responseText = details.responseText;
			}
		}
		MessageBox.error(
			this.errorText,
			{
				id: "serviceErrorMessageBox",
				details: (responseText as unknown as string),
				styleClass: this.component.getContentDensityClass(),<% if (gte11150) { %>
				actions : [MessageBox.Action.CLOSE],<% }else{ %>
				actions : [Action.CLOSE],<% } %>
				onClose: () => {
					this.messageOpen = false;
				}
			}
		);
	}
}
