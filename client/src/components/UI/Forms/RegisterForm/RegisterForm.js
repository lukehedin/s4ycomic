import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import validator from 'validator';
import Util from '../../../../Util';

import withForm from '../withForm';

import Button from '../../Button/Button';

class RegisterForm extends Component {
	render() {
		return <form onSubmit={this.props.submitForm}>
			{this.props.getField('email')}
			{this.props.getField('username')}
			{this.props.getField('password')} 
			{this.props.getField('confirmPassword')}
			<div className="button-container">
				<Button type="submit" label="Register" />
			</div>
			<div className="form-message">
				<p>Already have an account? <Link to={Util.route.login()}>Log in</Link></p>
			</div>
		</form>
	}
}

export default withForm(RegisterForm, {
	fields: {
		email: {
			label: 'Email', 
			getError: (val) => {
				if(!validator.isEmail(val)) return 'Please enter a valid email eg. yourname@example.com';
			}
		},
		username: {
			label: 'Username',
			getError: (val) => {
				if(!validator.isLength(val, { min: 3 })) return 'Please enter a longer username (minimum 3 characters)';
				if(!validator.isAlphanumeric(val)) return 'Username can only contain letters and numbers';
				if(!validator.isLength(val, { max: 20 })) return 'Please enter a shorter username (maximum 20 characters)';
			}
		},
		password: {
			label: 'Password',
			isPassword: true,
			getError: (val) => {
				if(!validator.isLength(val, { min: 8 })) return 'Password too short (minimum 8 characters)';
				if(!validator.isLength(val, { max: 127 })) return 'Password too long (maximum 127 characters)';
			}
		},
		confirmPassword: {
			label: 'Confirm password',
			isPassword: true,
			getError: (val, formData) => {
				if(val !== formData.password) return 'Passwords do not match';
			}
		}
	}
})