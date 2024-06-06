/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Card,
	CardBody,
	__experimentalInputControl as InputControl,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { store as siteSpecStore } from '../store/index.js';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from 'react';

function CorrectableTextField( { disabled, label, value, onChange } ) {
	const [ isEditing, setIsEditing ] = useState( false );
	return (
		<Item
			as="div"
			disabled={ disabled }
			onClick={ () => {
				if ( disabled ) {
					return;
				}
				setIsEditing( true );
			} }
		>
			{ isEditing ? (
				<InputControl
					isPressEnterToChange={ true }
					label={ label }
					value={ value }
					onChange={ ( newValue ) => {
						onChange( newValue );
						setIsEditing( false );
					} }
				/>
			) : (
				<BaseControl
					id={ `edit-site-spec-${ label }` }
					__nextHasNoMarginBottom
					label={ label }
				>
					<div className="big-sky__site-spec-value">{ value }</div>
				</BaseControl>
			) }
		</Item>
	);
}

function SiteSpecPreview( { disabled } ) {
	const {
		siteType,
		siteTitle,
		siteDescription,
		siteTopic,
		siteLocation,
		textColor,
		backgroundColor,
		accentColor,
	} = useSelect( ( select ) => {
		return {
			siteType: select( siteSpecStore ).getSiteType(),
			siteTitle: select( siteSpecStore ).getSiteTitle(),
			siteDescription: select( siteSpecStore ).getSiteDescription(),
			siteTopic: select( siteSpecStore ).getSiteTopic(),
			siteLocation: select( siteSpecStore ).getSiteLocation(),
			textColor: select( siteSpecStore ).getTextColor(),
			backgroundColor: select( siteSpecStore ).getBackgroundColor(),
			accentColor: select( siteSpecStore ).getAccentColor(),
		};
	} );
	const {
		setSiteType,
		setSiteTitle,
		setSiteDescription,
		setSiteTopic,
		setSiteLocation,
	} = useDispatch( siteSpecStore );
	return (
		<div className="big-sky__site-spec-preview">
			<Card size="medium">
				<CardBody>
					<ItemGroup isBordered isSeparated>
						<CorrectableTextField
							disabled={ disabled }
							label="Title"
							value={ siteTitle }
							onChange={ setSiteTitle }
						/>
						<CorrectableTextField
							disabled={ disabled }
							label="Description"
							value={ siteDescription }
							onChange={ setSiteDescription }
						/>
						<CorrectableTextField
							disabled={ disabled }
							label="Type"
							value={ siteType }
							onChange={ setSiteType }
						/>
						<CorrectableTextField
							disabled={ disabled }
							label="Topic"
							value={ siteTopic }
							onChange={ setSiteTopic }
						/>
						<CorrectableTextField
							disabled={ disabled }
							label="Location"
							value={ siteLocation }
							onChange={ setSiteLocation }
						/>
					</ItemGroup>
					<p>
						<strong>Text Color: </strong>
						<span style={ { color: textColor } }>
							{ textColor }
						</span>
					</p>
					<p>
						<strong>Background Color: </strong>
						<span style={ { backgroundColor } }>
							{ backgroundColor }
						</span>
					</p>
					<p>
						<strong>Accent Color: </strong>
						<span style={ { color: accentColor } }>
							{ accentColor }
						</span>
					</p>
				</CardBody>
			</Card>
		</div>
	);
}

export default SiteSpecPreview;
