import Toolkit from './toolkit.js';
import {
	AddSitePageTool,
	SetSiteColorsTool,
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from '../tools/site-tools.js';
import uuidv4 from '../../utils/uuid.js';

class SimpleSiteToolkit extends Toolkit {
	constructor( props, stateManager ) {
		super( props, stateManager );

		this.tools = this.getTools();
	}

	setSiteColors = ( { textColor, backgroundColor, accentColor } ) => {
		if ( textColor ) {
			this.setState( { textColor } );
		}
		if ( backgroundColor ) {
			this.setState( { backgroundColor } );
		}
		if ( accentColor ) {
			this.setState( { accentColor } );
		}
		return 'Site colors updated';
	};

	setSiteTitle = ( { value } ) => {
		this.setState( { siteTitle: value } );
		return `Site title set to "${ value }"`;
	};

	setSiteDescription = ( { value } ) => {
		this.setState( { siteDescription: value } );
		return `Site description set to "${ value }"`;
	};

	setSiteTopic = ( { value } ) => {
		this.setState( { siteTopic: value } );
		return `Site topic set to "${ value }"`;
	};

	setSiteType = ( { value } ) => {
		this.setState( { value } );
		return `Site type set to "${ value }"`;
	};

	setSiteLocation = ( { value } ) => {
		this.setState( { siteLocation: value } );
		return `Site location set to "${ value }"`;
	};

	setSitePages = ( { pages: newPages } ) => {
		this.setState( { pages: newPages } );
		return 'Site pages set';
	};

	addSitePage = ( { category, title, description } ) => {
		const { pages } = this.state;
		const newPage = {
			id: uuidv4(),
			category,
			title,
			description,
		};
		this.setState( { pages: [ ...pages, newPage ] } );
		return 'Adding site page';
	};

	onReset = () => {
		this.resetState();
	};

	getTools = () => [
		SetSiteTitleTool,
		SetSiteDescriptionTool,
		SetSiteTopicTool,
		SetSiteLocationTool,
		SetSiteTypeTool,
		SetSiteColorsTool,
		SetSitePagesTool,
		AddSitePageTool,
	];

	getValues = () => {
		const state = this.state;
		return {
			site: {
				title: state.siteTitle,
				description: state.siteDescription,
				topic: state.siteTopic,
				type: state.siteType,
				location: state.siteLocation,
			},
			design: {
				textColor: state.textColor,
				backgroundColor: state.backgroundColor,
				accentColor: state.accentColor,
			},
			pages: state.pages,
		};
	};

	getCallbacks = () => {
		return {
			[ SetSiteColorsTool.function.name ]: this.setSiteColors,
			[ SetSiteTitleTool.function.name ]: this.setSiteTitle,
			[ SetSiteDescriptionTool.function.name ]: this.setSiteDescription,
			[ SetSiteTopicTool.function.name ]: this.setSiteTopic,
			[ SetSiteTypeTool.function.name ]: this.setSiteType,
			[ SetSiteLocationTool.function.name ]: this.setSiteLocation,
			[ SetSitePagesTool.function.name ]: this.setSitePages,
			[ AddSitePageTool.function.name ]: this.addSitePage,
		};
	};
}

export default SimpleSiteToolkit;
