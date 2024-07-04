import React, { useCallback, useState } from 'react';
import {
	Button,
	DropZone,
	__experimentalInputControl as InputControl,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { close } from '@wordpress/icons';
import useChatIcon from '../hooks/use-chat-icon';

const FilePreview = ( { name, url, onRemove } ) => {
	return (
		<>
			{ url && (
				<img
					width="50"
					height="50"
					style={ { verticalAlign: 'middle' } }
					alt={ name }
					src={ url }
				/>
			) }
			{ name } <Button size="small" icon={ close } onClick={ onRemove } />
		</>
	);
};

function UserMessageInput( {
	label,
	placeholder,
	onSubmit,
	onChange,
	onCancel,
	fileUploadEnabled,
} ) {
	const { RiveComponent } = useChatIcon();
	const [ answer, setAnswer ] = useState( '' );
	const [ files, setFiles ] = useState( [] );

	const handleSubmit = useCallback(
		( event ) => {
			event.preventDefault();
			onSubmit( answer, files );
			setAnswer( '' );
			setFiles( [] );
		},
		[ answer, files, onSubmit ]
	);

	const handleChange = useCallback(
		( value ) => {
			setAnswer( value );
			if ( onChange ) {
				onChange( value );
			}
		},
		[ onChange ]
	);

	const readFileAsDataURL = ( file ) => {
		return new Promise( ( resolve, reject ) => {
			const reader = new FileReader();
			reader.onload = () => resolve( reader.result );
			reader.onerror = reject;
			reader.readAsDataURL( file );
		} );
	};

	const addFiles = useCallback(
		async ( newFiles ) => {
			const fileNamesAndUrls = await Promise.all(
				newFiles.map( async ( file ) => ( {
					name: file.name,
					url: await readFileAsDataURL( file ),
				} ) )
			);

			setFiles( [ ...files, ...fileNamesAndUrls ] );
		},
		[ files ]
	);

	const removeFile = useCallback(
		( index ) => {
			setFiles( files.filter( ( _, i ) => i !== index ) );
		},
		[ files ]
	);

	return (
		<div className="user-message-input">
			<InputControl
				size="__unstable-large"
				label={ label }
				prefix={
					<RiveComponent
						style={ { width: '32px', height: '32px' } }
					/>
				}
				placeholder={ placeholder }
				value={ answer }
				onChange={ handleChange }
				onKeyDown={ ( event ) => {
					if ( event.key === 'Enter' ) {
						handleSubmit( event );
					} else if ( event.key === 'Escape' && onCancel ) {
						onCancel();
					}
				} }
			/>
			{ fileUploadEnabled && (
				<>
					<DropZone onFilesDrop={ addFiles } />
					{ files.length > 0 && (
						<ItemGroup isBordered isSeparated>
							{ files.map( ( { name, url }, index ) => (
								<Item key={ index }>
									<FilePreview
										name={ name }
										url={ url }
										onRemove={ () => removeFile( index ) }
									/>
								</Item>
							) ) }
						</ItemGroup>
					) }
				</>
			) }
		</div>
	);
}

export default UserMessageInput;
