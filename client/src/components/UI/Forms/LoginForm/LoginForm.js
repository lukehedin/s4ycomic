import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import validator from 'validator';
import Util from '../../../../Util';

import asForm from '../asForm';

import Button from '../../Button/Button';

class LoginForm extends Component {
	render() {
		// NOAUTH: Disable login form
		return <div>
			<p>{Util.noauthNotSupportedMessage}</p>
			<p className="form-message"><Link to={Util.route.home()}>Take me home</Link></p>
		</div>

		// return <form onSubmit={this.props.submitForm}>
		// 	<h2>Login</h2>
		// 	{this.props.getField('emailUsername')}
		// 	{this.props.getField('password')}
		// 	<div className="button-container">
		// 		<Button type="submit" colour="pink" size="lg" label="Login" />
		// 	</div>
		// 	<p className="form-message">Forgot your password? <Link to={Util.route.forgotPassword()}>Forgot password</Link></p>
		// 	<p className="form-message">Don't have an account? <Link to={Util.route.register()}>Create an account</Link></p>
		// </form>
	}
}

export default asForm(LoginForm, {
	class: 'auth-form',
	fields: {
		emailUsername: {
			label: 'Email or username',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3, max: 255 })) return 'Please enter a valid username or email (3-255 characters)';
			}
		},
		password: {
			label: 'Password',
			isPassword: true
		}
	}
})