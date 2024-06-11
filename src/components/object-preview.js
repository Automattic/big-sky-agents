/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';

function ObjectPreview( { object, prefix = '' } ) {
	if ( ! object ) {
		return (
			<ItemGroup isBordered isSeparated>
				<Item>Nothing to see here</Item>
			</ItemGroup>
		);
	}

	// if the object has a getProperties method, use that to get the properties, otherwise use the object itself
	const properties =
		typeof object.getProperties === 'undefined'
			? Object.keys( object ).map( ( prop ) => {
					return {
						prop,
						label: prop,
					};
			  } )
			: object
					.getProperties()
					.filter( ( { hidden } ) => ! hidden )
					.map( ( { prop, label } ) => ( {
						prop,
						label,
					} ) );

	return (
		<div className="big-sky__object-preview">
			<ItemGroup isBordered isSeparated>
				{ properties.map( ( { prop, label } ) => (
					<Item
						as="div"
						key={ prop }
						className={ `big-sky__edit-site-spec-${ prefix }${ prop }` }
						onClick={ () => {
							console.log( `clicked ${ prop } - would edit now` );
						} }
					>
						<BaseControl
							id={ `edit-site-spec-${ prop }` }
							__nextHasNoMarginBottom
							label={ label }
						>
							<div
								className={ `big-sky__site-spec-label big-sky__site-spec-label-${ prefix }${ prop }` }
							>
								{ Array.isArray( object[ prop ] ) && (
									<div>
										{ object[ prop ].map(
											( item, index ) => (
												<ObjectPreview
													key={ index }
													object={ item }
													prefix={ `${ prop }-${ index }-` }
												/>
											)
										) }
									</div>
								) }
								{ ( typeof object[ prop ] === 'undefined' ||
									object[ prop ] === null ) && (
									<span className="big-sky__empty">
										empty
									</span>
								) }
								{ ! Array.isArray( object[ prop ] ) &&
									typeof object[ prop ] !== 'object' &&
									object[ prop ] }
								{ ! Array.isArray( object[ prop ] ) &&
									typeof object[ prop ] === 'object' && (
										<ObjectPreview
											object={ object[ prop ] }
											prefix={ `${ prop }-` }
										/>
									) }
							</div>
						</BaseControl>
					</Item>
				) ) }
			</ItemGroup>
		</div>
	);
}

export default ObjectPreview;
