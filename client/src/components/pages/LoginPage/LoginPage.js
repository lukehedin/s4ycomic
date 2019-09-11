import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Util from '../../../Util';

import LoginForm from '../../UI/Forms/LoginForm/LoginForm';

export default class LoginPage extends Component {
	render() {
		if(Util.auth.getUserId()) return <Redirect to={Util.route.home()} />

		return <div className="page-login">
			<h2>Login</h2>
			<LoginForm onSubmit={(form, formData) => {
				form.setLoading(true);
				
				Util.api.post('/api/login', {
					email: formData.email,
					password: formData.password
				})
				.then((result) => {
					if(result.error) {
						form.setLoading(false);
						form.setOverallError(result.error);
					} else {
						Util.auth.setToken(result.token);
						window.location.href = Util.route.home();
					}
				});
			}} />
			<h4><Link to={Util.route.register()}>Don't have an acount? Register</Link></h4>
			<h4><Link to={Util.route.forgotPassword()}>Forgot your password?</Link></h4>
		</div>;
	}
}