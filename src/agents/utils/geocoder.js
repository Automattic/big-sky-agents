/**
 * This tool produces 3 possible responses:
 * * a specific set of coordinates
 */
class Geocoder {
	constructor( mapboxApiKey ) {
		this.mapboxApiKey = mapboxApiKey;
	}

	async geocode( locationName ) {
		// call https://api.mapbox.com/search/geocode/v6/forward?q={search_text}&access_token={access_token}
		const response = await fetch(
			`https://api.mapbox.com/search/geocode/v6/forward?q=${ encodeURIComponent(
				locationName
			) }&access_token=${ encodeURIComponent( this.mapboxApiKey ) }`
		);

		const data = await response.json();

		console.log( 'Geocode Response', data );

		// actually let's map a list of locations from the existing data.features array
		const featuresResponse = data?.features?.map( ( feature ) => {
			return {
				mapbox_id: feature.properties.mapbox_id,
				type: feature.properties.feature_type,
				name: feature.properties.place_formatted,
				lat: feature.properties.coordinates.latitude,
				lon: feature.properties.coordinates.longitude,
				accuracy: 'rooftop',
			};
		} );

		// TODO: if there are multiple potential matching locations we could induce an
		// agentic response by returning a set of option choices rather than just the
		// coordinates of the first feature in the response

		return featuresResponse;
	}
}

export default Geocoder;
