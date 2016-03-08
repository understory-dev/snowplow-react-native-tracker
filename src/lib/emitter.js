/*
 * Node.js tracker for Snowplow: emitter.js
 * 
 * Copyright (c) 2014-2015 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */
import axios from 'axios';

/**
 * Create an emitter object which will send events to a collector
 *
 * @param { string } endpoint The collector to which events will be sent
 * @param { string } protocol "http" or "https"
 * @param { number } port The port for requests to use
 * @param { string } method "get" or "post"
 * @param { number } bufferSize Number of events which can be queued before flush is called
 * @param { function } callback Callback passed to the request function
 */
export default (endpoint, protocol, port, method, bufferSize, callback) => {
	protocol = (protocol || 'http').toLowerCase();
	method = (method || 'get').toLowerCase();
	if (bufferSize === null || typeof bufferSize === 'undefined') {
		bufferSize = method === 'get' ? 0 : 10;
	}
	const portString = port ? ':' + port : '';
	const path = method === 'get' ? '/i' : '/com.snowplowanalytics.snowplow/tp2';
	const targetUrl = protocol + '://' + endpoint + portString + path;
	let buffer = [];

	/**
	 * Send all events queued in the buffer to the collector
	 */
	function flush() {
		const temp = buffer;
		buffer = [];
		if (method === 'post') {
			const postJson = {
				schema: 'iglu:com.snowplowanalytics.snowplow/payload_data/jsonschema/1-0-0',
				data: temp.map(valuesToStrings)
			};
			axios.post({
				url: targetUrl,
				data: postJson,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			}).then(callback);

		} else {
			for (let i=0; i<temp.length; i++) {
				axios.get({url: targetUrl, params: temp[i]}).then(callback);
			}
		}
	}

	return {
		flush: flush,
		input: (payload)  => {
			buffer.push(payload);
			if (buffer.length >= bufferSize) {
				flush();
			}
		}
	};
}

/**
 * Convert all fields in a payload dictionary to strings
 *
 * @param { object } payload Payload on which the new dictionary is based
 */
function valuesToStrings(payload) {
	let stringifiedPayload = {};
	for (let key in payload) {
		if (payload.hasOwnProperty(key)) {
			stringifiedPayload[key] = payload[key].toString();
		}
	}
	return stringifiedPayload;
}
