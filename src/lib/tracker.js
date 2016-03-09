"use strict";
import core from 'snowplow-tracker-core';
import version from './version';

/**
 * Snowplow Tracker
 *
 * @param { string } emitters or array emitters The emitter or emitters to which events will be sent
 * @param { string } namespace The namespace of the tracker
 * @param { string } appId The application ID
 * @param { boolean } encodeBase64 Whether unstructured events and custom contexts should be base 64 encoded
 */
export default ({ emitters, namespace, appId, encodeBase64 = true }) => {
	if (!(emitters instanceof Array)) {
		emitters = [emitters];
	}

	let trackerCore = core(encodeBase64, sendPayload);

	trackerCore.setPlatform('srv'); // default platform
	trackerCore.setTrackerVersion('node-' + version);
	trackerCore.setTrackerNamespace(namespace);
	trackerCore.setAppId(appId);

	/**
	 * Send the payload for an event to the endpoint
	 *
	 * @param { object } payload Dictionary of name-value pairs for the querystring
	 */
	function sendPayload(payload) {
		const builtPayload = payload.build();
		for (let i=0; i<emitters.length; i++) {
			emitters[i].input(builtPayload);
		}
	}

	const trackEcommerceTransaction = trackerCore.trackEcommerceTransaction;

	/**
	 * Track an ecommerce transaction and all items in that transaction
	 * Each item is represented by a dictionary which may have the following fields:
	 * 1. string sku Required. SKU code of the item.
	 * 2. string name Optional. Name of the item.
	 * 3. string category Optional. Category of the item.
	 * 4. string price Required. Price of the item.
	 * 5. string quantity Required. Purchase quantity.
	 * 6. array context Optional. Custom context relating to the item.
	 * 7. number tstamp Optional. Timestamp for the item.
	 *
	 * @param { string } orderId Required. Internal unique order id number for this transaction.
	 * @param { string } affiliation Optional. Partner or store affiliation.
	 * @param { string } total Required. Total amount of the transaction.
	 * @param { string } tax Optional. Tax amount of the transaction.
	 * @param { string } shipping Optional. Shipping charge for the transaction.
	 * @param { string } city Optional. City to associate with transaction.
	 * @param { string } state Optional. State to associate with transaction.
	 * @param { string } country Optional. Country to associate with transaction.
	 * @param { string } currency Optional. Currency to associate with this transaction.
	 * @param { Array } items Optional. Items which make up the transaction.
	 * @param { Array } context Optional. Context relating to the event.
	 * @param { number } tstamp Optional. Timestamp for the event.
	 */
	trackerCore.trackEcommerceTransaction = function (orderId, affiliation, total, tax, shipping, city, state, country, currency, items, context, tstamp) {
		trackEcommerceTransaction(
			orderId,
			affiliation,
			total,
			tax,
			shipping,
			city,
			state,
			country,
			currency,
			context,
			tstamp
		);

		if (items) {
			for (let i=0; i<items.length; i++) {
				const item = items[i];
				trackerCore.trackEcommerceTransactionItem(
					orderId,
					item.sku,
					item.name,
					item.category,
					item.price,
					item.quantity,
					currency,
					item.context,
					tstamp
				);
			}
		}
	};

	return trackerCore;
}
