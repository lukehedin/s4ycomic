import React, { Component } from 'react';
import validator from 'validator';
import Textarea from 'react-textarea-autosize';
import Util from '../../../Util';

import Dropdown from '../Dropdown/Dropdown';
import Checkbox from '../Checkbox/Checkbox';
import ImageUpload from '../ImageUpload/ImageUpload';

export default function asForm(WrappedForm, formConfig) {
	return class extends Component {
		constructor(props){
			super(props);
			
			let formData = this.props.formData || {};
			Object.keys(formConfig.fields).forEach(fieldName => {
				//Eventually extend this to get values from querystring if possible
				if(!formData[fieldName]) formData[fieldName] = formConfig.fields[fieldName].type === Util.enums.FieldType.Checkbox ? false : '';
			});

			this.state = {
				isLoading: false,
				
				formData: formData,
				formOverallMessage: null,
				formErrors: {},
				formOverallError: null
			};

			this.formWrapperRef = React.createRef();

			this.submitForm = this.submitForm.bind(this);
			this.validateForm = this.validateForm.bind(this);
			this.updateFormData = this.updateFormData.bind(this);
			this.getField = this.getField.bind(this);
		}
		componentDidMount() {
			let formWrapperEl = this.formWrapperRef.current;
			if(formWrapperEl) {
				let autoFocusEls = formWrapperEl.getElementsByClassName('auto-focus');
				if(autoFocusEls[0]) autoFocusEls[0].focus();
			}
		}
		setLoading(isLoading) {
			this.setState({
				isLoading: isLoading
			});
		}
		submitForm(e) {
			e.preventDefault();
			let isValid = this.validateForm();
			if(isValid) this.props.onSubmit(this, this.state.formData);
		}
		validateForm() {
			let formErrors = {};
			let formOverallError = null;

			Object.keys(formConfig.fields).forEach(fieldName => {
				let fieldConfig = formConfig.fields[fieldName];
				let fieldValue = this.state.formData[fieldName];
				
				let error = fieldConfig.getError
					? fieldConfig.getError(fieldValue, this.state.formData)
					: null;

				// Required msg overwrites any custom ones
				const alwaysOptionalFieldTypes = [Util.enums.FieldType.Checkbox];
				if(!alwaysOptionalFieldTypes.includes(fieldConfig.type) && !fieldConfig.isOptional) {
					//If the type is a number, allow it even if 0. The validator catches all the falseys
					let hasValue = typeof(fieldValue) === "number"
						? true
						: validator.isLength(fieldValue, { min: 1 });
					if(!hasValue) error = 'This field is required'
				};

				if(error) {
					formErrors = {
						...formErrors,
						[fieldName]: error
					};
				}
			});

			if(formConfig.getOverallError) formOverallError = formConfig.getOverallError(this.state.formData);

			this.setState({ 
				formErrors, 
				formOverallError, 
				formOverallMessage: null //Hide any overall message on a new submit attempt
			});

			return formOverallError || !Util.array.any(Object.keys(formErrors));
		}
		setOverallMessage(message) {
			this.setState({
				formOverallMessage: message
			});
		}
		setOverallError(error) {
			this.setState({
				formOverallError: error
			});
		}
		setFormData(formData) {
			this.setState({
				formData: formData
			});
		}
		updateFormData(fieldName, value) {
			this.setState({
				formData: {
					...this.state.formData,
					[fieldName]: value
				},
				formErrors: {
					...this.state.formErrors,
					[fieldName]: null
				}
			})
		}
		getField(fieldName) {
			let fieldConfig = formConfig.fields[fieldName];

			let field = null;
			let hideContainerLabel = !fieldConfig.label;

			switch(fieldConfig.type) {
				case Util.enums.FieldType.Textarea:
					field = <Textarea
						className={`${fieldConfig.isAutoFocus ? 'auto-focus' : ''}`}
						placeholder={fieldConfig.placeholder || null}
						onChange={(e) => this.updateFormData(fieldName, e.target.value)} 
						value={this.state.formData[fieldName]}
						disabled={this.state.isLoading}
					/>;
					break;
					
				case Util.enums.FieldType.Dropdown:
					field = <Dropdown 
						value={null}
						onChange={value => this.updateFormData(fieldName, value)}
						displayProp={fieldConfig.displayProp}
						displayPropFn={fieldConfig.displayPropFn}
						valueProp={fieldConfig.valueProp || 'value'}
						isBlankAllowed={fieldConfig.isBlankAllowed}
						blankLabel={fieldConfig.blankLabel}
						disabled={this.state.isLoading}
						options={fieldConfig.getOptions
							? fieldConfig.getOptions(this.state.formData)
							: fieldConfig.options}
					/>;
					break;

				case Util.enums.FieldType.Checkbox:
					hideContainerLabel = true; //Checkbox makes its own label
					field = <Checkbox 
						label={fieldConfig.label}
						onChange={(value) => this.updateFormData(fieldName, value)}
						value={this.state.formData[fieldName]}
						disabled={this.state.isLoading}
					/>;
					break;

				default:
					field = <input 
						className={`${fieldConfig.isAutoFocus ? 'auto-focus' : ''}`}
						placeholder={fieldConfig.placeholder || null}
						onChange={(e) => this.updateFormData(fieldName, e.target.value)} 
						type={fieldConfig.isPassword ? "password" : "text"} 
						value={this.state.formData[fieldName]}
						disabled={this.state.isLoading}
					/>;
					break;
			}

			let fieldError = this.state.formErrors[fieldName];

			return <div className={`field-container ${!!fieldError ? 'error' : ''}`}>
				{hideContainerLabel ? null : <label>{fieldConfig.label}{fieldConfig.isOptional ? <span className="optional"> (optional)</span> : null}</label>}
				{field}
				{!!fieldError ? <div className="field-error">{fieldError}</div> : null}
			</div>;
		}
		render() {
			return <div ref={this.formWrapperRef} className={`form-wrapper ${formConfig.class || 'flat-form'}`}>
				{this.state.isLoading ? <div className="loader masked"></div> : null}
				<WrappedForm 
					formData={this.state.formData} 
					getField={this.getField}
					submitForm={this.submitForm}
					{...this.props}
				/>
				{this.state.formOverallError || this.state.formOverallMessage
					? <div className="field-container">
						<div className="overall-error field-error">{this.state.formOverallError}</div> 
						<div className="form-message">{this.state.formOverallMessage}</div>
					</div>
					: null
				}
			</div>
		}
	}
}