import React, { Component } from 'react';
import Util from '../../../Util';

import logo from '../../../images/logo_white.png';

export default class AppFooter extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		return <footer className="app-footer">
			<div className="container">
				<div className="row"> 
					<div className="app-footer-inner">
						<img src={logo} className="app-logo" alt="logo" />
						<div className="flex-spacer"></div>
						<div>
						<h6>Created by <a target="_blank" href="https://www.instagram.com/imdoodlir/">imdoodlir</a></h6>
						<h6>© 2019 Speak 4 Yourself</h6>
						</div>
					</div>
				</div>
			</div>
		</footer>
	}
}