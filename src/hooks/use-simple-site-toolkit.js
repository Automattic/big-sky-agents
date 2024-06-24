/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from 'react';

/**
 * Internal dependencies
 */

import {
	// AddPageSectionTool,
	// SetPageCategoryTool,
	// SetPageDescriptionTool,
	// SetPageSectionsTool,
	// SetPageTitleTool,
	AddSitePageTool,
	SetSiteColorsTool,
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from '../agents/tools/site-tools.js';

import uuidv4 from '../utils/uuid.js';

const useSimpleSiteToolkit = ( /* { pageId } */ ) => {
	const [ textColor, setTextColor ] = useState();
	const [ backgroundColor, setBackgroundColor ] = useState();
	const [ accentColor, setAccentColor ] = useState();
	const [ siteTitle, setSiteTitle ] = useState();
	const [ siteDescription, setSiteDescription ] = useState();
	const [ siteTopic, setSiteTopic ] = useState();
	const [ siteType, setSiteType ] = useState();
	const [ siteLocation, setSiteLocation ] = useState();
	const [ pages, setPages ] = useState( [] );

	const values = useMemo( () => {
		return {
			site: {
				title: siteTitle,
				description: siteDescription,
				topic: siteTopic,
				type: siteType,
				location: siteLocation,
			},
			design: {
				textColor,
				backgroundColor,
				accentColor,
			},
			pages,
		};
	}, [
		textColor,
		backgroundColor,
		accentColor,
		siteTitle,
		siteDescription,
		siteTopic,
		siteType,
		siteLocation,
		pages,
	] );

	const callbacks = useMemo( () => {
		return {
			[ SetSiteColorsTool.function.name ]: ( {
				textColor: tc,
				backgroundColor: bc,
				accentColor: ac,
			} ) => {
				if ( tc ) {
					setTextColor( tc );
				}
				if ( bc ) {
					setBackgroundColor( bc );
				}
				if ( ac ) {
					setAccentColor( ac );
				}
				return 'Site colors updated';
			},
			[ SetSiteTitleTool.function.name ]: ( { title } ) => {
				setSiteTitle( title );
				return `Site title set to "${ title }"`;
			},
			[ SetSiteDescriptionTool.function.name ]: ( { description } ) => {
				console.warn( 'setSiteDescription', { description } );
				setSiteDescription( description );
				return `Site description set to "${ description }"`;
			},
			[ SetSiteTopicTool.function.name ]: ( { topic } ) => {
				setSiteTopic( topic );
				return `Site topic set to "${ topic }"`;
			},
			[ SetSiteTypeTool.function.name ]: ( {
				siteType: newSiteType,
			} ) => {
				setSiteType( newSiteType );
				return `Site type set to "${ newSiteType }"`;
			},
			[ SetSiteLocationTool.function.name ]: ( { location } ) => {
				setSiteLocation( location );
				return `Site location set to "${ location }"`;
			},
			[ SetSitePagesTool.function.name ]: ( { pages: newPages } ) => {
				setPages( newPages );
				return 'Site pages set';
			},
			[ AddSitePageTool.function.name ]: ( {
				category,
				title,
				description,
			} ) => {
				setPages( ( currentPages ) => [
					...currentPages,
					{
						id: uuidv4(),
						category,
						title,
						description,
					},
				] );
				return 'Adding site page';
			},
			// TODO
			// [ SetPageSectionsTool.function.name ]: ( { pageId, sections } ) => {
			// 	setPageSections( sections );
			// 	return 'Set page sections';
			// },
			// [ AddPageSectionTool.function.name ]: ( { pageId, category, description } ) => {
			// 	setPageSections( ( currentSections ) => [
			// 		...currentSections,
			// 		{
			// 			pageId,
			// 			category,
			// 			description,
			// 		},
			// 	] );
			// 	return 'Adding page section';
			// },
			// TODO: Implement these
			// [ SetPageCategoryTool.function.name ]: ( { pageId, category } ) => {
			// 	setPageCategory( pageId, category );
			// 	return `Set page category to "${ category }"`;
			// },
			// [ SetPageDescriptionTool.function.name ]: ( { pageId, description } ) => {
			// 	setPageDescription( pageId, description );
			// 	return `Set page description to "${ description }"`;
			// },
			// [ SetPageTitleTool.function.name ]: ( { pageId, title } ) => {
			// 	setPageTitle( pageId, title );
			// 	return `Set page title to "${ title }"`;
			// },
		};
	}, [
		setAccentColor,
		setBackgroundColor,
		setSiteDescription,
		setSiteLocation,
		setPages,
		setSiteTitle,
		setSiteTopic,
		setSiteType,
		setTextColor,
	] );

	const tools = useMemo( () => {
		return [
			SetSiteTitleTool,
			SetSiteDescriptionTool,
			SetSiteTopicTool,
			SetSiteLocationTool,
			SetSiteTypeTool,
			SetSiteColorsTool,
			SetSitePagesTool,
			AddSitePageTool,
		];
	}, [] );

	const onReset = useCallback( () => {
		setTextColor( undefined );
		setBackgroundColor( undefined );
		setAccentColor( undefined );
		setSiteTitle( undefined );
		setSiteDescription( undefined );
		setSiteTopic( undefined );
		setSiteType( undefined );
		setSiteLocation( undefined );
		setPages( [] );
	}, [] );

	return {
		onReset,
		tools,
		values,
		callbacks,
	};
};

export default useSimpleSiteToolkit;
