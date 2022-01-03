export default {
	/**
	 * Rounds the currency value to 2 digits
	 *
	 * @public
	 * @param {string} sValue value to be formatted
	 * @returns {string} formatted currency value with 2 digits
	 */
	currencyValue: (sValue:string) => {
		if (!sValue) {
			return "";
		}

		return parseFloat(sValue).toFixed(2);
	}
}