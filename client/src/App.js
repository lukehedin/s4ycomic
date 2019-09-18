import React, { Component } from 'react';
import { connect } from 'react-redux';
import { closeModal, closeAllModals } from './redux/actions';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Util from './Util';
import Div100vh from 'react-div-100vh';

import loaderFace from './images/face_black.png';

import AppHeader from './components/UI/AppHeader/AppHeader';
import AppFooter from './components/UI/AppFooter/AppFooter';
import Modal from './components/UI/Modal/Modal';
import RegisterPage from './components/pages/RegisterPage/RegisterPage';
import LoginPage from './components/pages/LoginPage/LoginPage';
import GamePage from './components/pages/GamePage/GamePage';
import VerifyPage from './components/pages/VerifyPage/VerifyPage';
import HallOfFamePage from './components/pages/HallOfFamePage/HallOfFamePage';
import ProfilePage from './components/pages/ProfilePage/ProfilePage';
import AboutPage from './components/pages/AboutPage/AboutPage';
import Error404Page from './components/pages/Error404Page/Error404Page';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage/ForgotPasswordPage';
import SetPasswordPage from './components/pages/SetPasswordPage/SetPasswordPage';
import TermsOfServicePage from './components/pages/TermsOfServicePage/TermsOfServicePage';
import PrivacyPolicyPage from './components/pages/PrivacyPolicyPage/PrivacyPolicyPage';

class App extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			isUnderMaintenance: false
		};
	}
	componentWillUnmount() {
		this.unlisten();
	}
	componentDidMount() {
		Util.analytics.init();

		this.unlisten = this.props.history.listen((location, action) => {
			this.props.closeAllModals();
			Util.analytics.page();
		});

		Util.api.post('/api/authenticate')
			.then(result => {
				//An error also triggers maintenance mode
				if(!result.error && !result.isUnderMaintenance) {
					Util.context.set(result);
				}

				this.setState({
					isLoading: false,
					isUnderMaintenance: true
				});
			});
	}
	render() {
		let ifAuthenticated = (component) => {
			return Util.context.isAuthenticated()
				? component
				: <Redirect to={Util.route.home()} />;
		};

		let ifNotAuthenticated = (component) => {
			return !Util.context.isAuthenticated()
				? component
				: <Redirect to={Util.route.home()} />;
		};

		let getApp = () => {
			return <div className="app">
				<AppHeader />
				<Switch>
					{/* If NOT authenticated */}
					<Route exact path="/register" render={({ match }) => ifNotAuthenticated(<RegisterPage />)} />
					<Route exact path="/login" render={({ match }) => ifNotAuthenticated(<LoginPage />)} />
					<Route exact path="/forgot-password" render={({ match }) => ifNotAuthenticated(<ForgotPasswordPage /> )} />
					
					{/* Verification and password resets can happen even if logged in (odd scenario but plausible) */}
					<Route exact path="/verify/:token" render={({ match }) => <VerifyPage token={match.params.token} />} />
					<Route exact path="/set-password/:token" render={({ match }) => <SetPasswordPage token={match.params.token} />} />

					<Route exact path="/" render={() => <Redirect to={Util.route.game(Util.context.getLatestGameId())} />} />
					<Route exact path="/game/:gameId" render={({ match }) => <GamePage gameId={match.params.gameId} />} />
					<Route exact path="/game/:gameId/comic/:comicId" render={({ match }) => <GamePage gameId={match.params.gameId} comicId={match.params.comicId} />} />

					<Route exact path="/hall-of-fame" render={({ match }) => <Redirect to={Util.route.hallOfFame(Util.context.getLatestGameId())} /> } />
					<Route exact path="/hall-of-fame/:gameId" render={({ match }) => <HallOfFamePage gameId={match.params.gameId} />}/>
					
					<Route exact path="/profile" render={({ match }) => ifAuthenticated(<Redirect to={Util.route.profile(Util.context.getUserId())} />)} />
					<Route exact path="/profile/:userId" render={({ match }) => <ProfilePage userId={match.params.userId} />} />
					
					<Route exact path="/about" render={({ match }) => <AboutPage />}/>
					<Route exact path="/privacy-policy" render={({ match }) => <PrivacyPolicyPage />}/>
					<Route exact path="/terms-of-service" render={({ match }) => <TermsOfServicePage />}/>
					
					{/* No other route match, 404 */}
					<Route render={({ match }) => <Error404Page />} />
				</Switch>
				<div className="flex-spacer"></div>
				<AppFooter />
				{Util.array.any(this.props.modals)
					? <div className="modal-overlay" onMouseDown={(e) => {
						e.stopPropagation();
						if(e.target.classList.contains('modal-overlay')) this.props.closeModal(null);
					}}>
						{this.props.modals.map(modal => <Modal key={modal.modalId} modal={modal} />)}
					</div>
					: null
				}
			</div>;
		}

		let content = this.state.isLoading
			? <div className="loader image-loader"><img alt="" src={loaderFace} /></div>
			: this.state.isUnderMaintenance
				? <div className="under-maintenance-panel">
					<img alt="" src={loaderFace} />
					<h2>Sorry, we are experiencing some technical difficulties.</h2>
					<p>Speak 4 Yourself is currently undergoing maintenance, but should be back online momentarily.</p>
				</div>
				: getApp();

		return <Div100vh onScroll={Util.array.any(this.props.modals) ? Util.event.absorb : null} className="app-container">
			{content}
		</Div100vh>;
	}
}

const mapStateToProps = state => ({
	modals: state.modalReducer.modals
});

export default connect(mapStateToProps, { closeModal, closeAllModals })(withRouter(App));