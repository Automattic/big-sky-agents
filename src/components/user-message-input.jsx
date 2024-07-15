import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Button,
	DropZone,
	__experimentalInputControl as InputControl,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { arrowRight, close } from '@wordpress/icons';
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
	value,
	label,
	placeholder,
	onSubmit,
	onChange,
	onCancel,
	fileUploadEnabled,
} ) {
	const { RiveComponent } = useChatIcon();
	const [ files, setFiles ] = useState( [] );
	const inputRef = useRef( null );

	const handleSubmit = useCallback(
		( event ) => {
			event.preventDefault();
			onSubmit( value ?? '(no answer)', files );
			setFiles( [] );
		},
		[ files, onSubmit, value ]
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

	useEffect( () => {
		if ( inputRef.current ) {
			inputRef.current.focus();
		}
	}, [ value ] );

	return (
		<div className="user-message-input">
			<InputControl
				ref={ inputRef }
				size="__unstable-large"
				label={ label }
				prefix={
					<RiveComponent
						style={ { width: '32px', height: '32px' } }
					/>
				}
				suffix={
					value && (
						<Button
							label="Submit"
							icon={ arrowRight }
							iconPosition="right"
							variant="tertiary"
							onClick={ handleSubmit }
						/>
					)
				}
				placeholder={ placeholder }
				value={ value }
				onChange={ onChange }
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
