import React, { Component } from 'react';
import Util from '../../../Util';

import Button from '../../UI/Button/Button';

export default class VerifyPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true
		};
	}
	componentDidMount() {
		Util.api.post('/api/verifyAccount', {
			token: this.props.token
		})
		.then((result) => {
			if(!result.error) {
				Util.context.set(result);
				window.location.href = Util.route.home();
			} else {
				this.setState({
					isLoading: false
				});
			}
		});
	}
	render() {
		return <div className="page-verify">
			<div className="panel-standard">
				<div className="container">
						<div className="row">
							{/* NOAUTH: Disable verify page */}
							<div>
								<p>{Util.authNotSupportedMessage}</p>
								<p className="form-message"><Link to={Util.route.home()}>Take me home</Link></p>
							</div>;
							{/* {this.state.isLoading 
								? <div className="loader"></div> 
								: <div className="verify-message">
										<h1 className="page-title">Sorry, something went wrong.</h1>
										<p className="center">Could not verify account.</p>
										<div className="button-container">
											<Button to={Util.route.home()} colour="black" size="md" label="Back to home" />
										</div>
									</div>
							} */}
					</div>
				</div>
			</div>
		</div>;
	}
}