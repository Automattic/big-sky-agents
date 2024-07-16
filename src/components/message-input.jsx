import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Button,
	DropZone,
	__experimentalInputControl as InputControl,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { close } from '@wordpress/icons';
import useChatIcon from '../hooks/use-chat-icon';

const sendSVG = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="2 2 42 42"
		width="24"
		height="24"
	>
		<path d="M4.02 42 46 24 4.02 6 4 20l30 4-30 4z"></path>
		<path fill="none" d="M0 0h48v48H0z"></path>
	</svg>
);

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

function MessageInput( {
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
			// if now files or value, don't submit
			if ( ! value && files.length === 0 ) {
				return;
			}
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
					<Button
						label="Submit"
						disabled={ ! value }
						icon={ sendSVG }
						iconPosition="right"
						variant="tertiary"
						onClick={ handleSubmit }
					/>
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

export default MessageInput;
