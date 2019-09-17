import React, { Component } from 'react';
import Util from '../../../Util';
import { Link } from 'react-router-dom';

import Button from '../../UI/Button/Button';

export default class TemplateNavigation extends Component {
	render() {
		let latestTemplateId = Util.context.getLatestTemplateId();
		
		return <div className={`template-navigation ${this.props.className || ''}`}>
			<div className="button-container">
				<Button 
					to={Util.route.template(1)} 
					className={this.props.templateId > 1 ? '' : 'disabled invisible'} 
					label="First"
					leftIcon={Util.icon.first}
				/>
				<Button 
					to={Util.route.template(this.props.templateId - 1)} 
					className={this.props.templateId > 1 ? '' : 'disabled invisible'} 
					label="Previous" 
					leftIcon={Util.icon.back}
				/>
			</div>
			<div className="flex-spacer"></div>
			<div className="template-info">
				<h5>Template</h5>
				<h3><Link to={Util.route.templateList()}>{this.props.templateId}</Link></h3>
			</div>
			<div className="flex-spacer"></div>
			<div className="button-container">
				<Button 
					to={Util.route.template(this.props.templateId + 1)} 
					className={this.props.templateId !== latestTemplateId ? '' : 'disabled invisible'}
					label="Next"
					rightIcon={Util.icon.next}
				/>
				<Button 
					to={Util.route.template()} 
					className={this.props.templateId !== latestTemplateId ? '' : 'disabled invisible'}
					label="Latest" 
					rightIcon={Util.icon.last}
				/>
			</div>
		</div>;
	}
}