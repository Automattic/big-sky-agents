import { Icon, MenuGroup, MenuItem } from '@wordpress/components';
import './page-list.scss';

function PageList( { pages, disabled, selectedPage, onSelectPage } ) {
	return (
		<div className="big-sky__page-list">
			<MenuItem
				icon={ <Icon icon="admin-home" /> }
				iconPosition="left"
				isSelected={ ! selectedPage }
				disabled={ disabled }
				onClick={ () => onSelectPage( null ) }
			>
				Site
			</MenuItem>
			<MenuGroup label="Pages" isRounded isSeparated>
				{ pages &&
					pages.map( ( page, index ) => (
						<MenuItem
							icon={ <Icon icon="text-page" /> }
							iconPosition="left"
							disabled={ disabled }
							isSelected={ selectedPage === page }
							key={ index }
							onClick={ () => {
								onSelectPage( page.id );
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
					Add a new page
				</MenuItem>
			</MenuGroup>
		</div>
	);
}

export default PageList;
