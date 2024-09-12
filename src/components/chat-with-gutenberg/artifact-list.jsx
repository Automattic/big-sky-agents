import { Icon, MenuGroup, MenuItem } from '@wordpress/components';
import './artifact-list.scss';

function ArtifactList( {
	artifacts,
	disabled,
	selectedArtifact,
	onSelectArtifact,
} ) {
	return (
		<div className="big-sky__artifact-list">
			<MenuItem
				icon={ <Icon icon="admin-home" /> }
				iconPosition="left"
				isSelected={ ! selectedArtifact }
				disabled={ disabled }
				onClick={ () => onSelectArtifact( null ) }
			>
				Site
			</MenuItem>
			<MenuGroup label="Pages" isRounded isSeparated>
				{ artifacts &&
					artifacts.map( ( page, index ) => (
						<MenuItem
							icon={ <Icon icon="text-page" /> }
							iconPosition="left"
							disabled={ disabled }
							isSelected={ selectedArtifact === page }
							key={ index }
							onClick={ () => {
								onSelectArtifact( page.id );
							} }
						>
							{ page.title }
						</MenuItem>
					) ) }
				<MenuItem
					icon={ <Icon icon="welcome-add-page" /> }
					iconPosition="left"
					disabled={ disabled }
					onClick={ () => {
						// console.log( 'Add a new page' );
					} }
				>
					Add a new artifact
				</MenuItem>
			</MenuGroup>
		</div>
	);
}

export default ArtifactList;
