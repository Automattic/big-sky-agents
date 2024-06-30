import WapuuAgent from './wapuu-agent.js';
import TutorAgent from './tutor-agent.js';
import DesignAgent from './design-agent.js';
import SiteSpecAgent from './site-spec-agent.js';
import PageSpecAgent from './page-spec-agent.js';
import WooAgent from './woo-agent.js';
import StatsAgent from './stats-agent.js';

export default [
	new WapuuAgent(),
	new SiteSpecAgent(),
	new PageSpecAgent(),
	new DesignAgent(),
	new TutorAgent(),
	new StatsAgent(),
	new WooAgent(),
];
