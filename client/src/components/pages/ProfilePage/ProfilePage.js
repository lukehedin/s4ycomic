import React, { Component } from 'react';
import CountUp from 'react-countup';
import { Link } from 'react-router-dom';
import Util from '../../../Util';
import moment from 'moment';

import ComicList from '../../UI/ComicList/ComicList';
import Avatar from '../../UI/Avatar/Avatar';
import ComicInfoLabel from '../../UI/ComicInfoLabel/ComicInfoLabel';

//this.props.userIdOrUserName
export default class ProfilePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			user: null
		};
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.userIdOrUserName !== prevProps.userIdOrUserName;
	}
	componentDidUpdate(prevProps, prevState, isNewUserIdOrUsername) {
		if(isNewUserIdOrUsername) this.fetchData();
	}
	fetchData() {
		this.setState({
			isLoading: true
		});
		
		Util.api.post('/api/getUser', isNaN(this.props.userIdOrUserName)
			? { requestedUsername: this.props.userIdOrUserName }
			: { requestedUserId: this.props.userIdOrUserName }
		)
		.then(result => {
			if(!result.error) {
				this.setState({
					user: result.user,
					userStats: result.userStats
				});
			}

			this.setState({
				isLoading: false
			})
		});
	}
	render() {
		let isMe = this.state.user && this.state.user.userId === Util.context.getUserId();

		return <div className="page-profile">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<div className="user-info-container">
							{this.state.isLoading
								? <div className="loader"></div>
								: this.state.user
									? <div className="user-info">
										<div className="user-info-header">
											<Avatar className="avatar-lg" user={this.state.user} to={isMe ? Util.route.settings() : null} />
											<div className="user-info-header-detail">
												<h2 className="user-name">{this.state.user.username}</h2>
												<p className="joined-date sm">Joined {moment(this.state.user.createdAt).fromNow()}</p>
											</div>
										</div>
										<div className="user-stats">
											<div className="user-stats-row">
												<div className="user-stat">
													<h5>Created</h5>
													<h2><CountUp end={this.state.userStats.panelCount} /></h2>
													<h5>{Util.format.pluralise(this.state.userStats.panelCount, 'panel')}</h5>
												</div>
												<div className="user-stat">
													<h5>Featured in</h5>
													<h2><CountUp end={this.state.userStats.comicCount} /></h2>
													<h5>{Util.format.pluralise(this.state.userStats.comicCount, 'comic')}</h5>
												</div>
											</div>
											<div className="user-stat">
												<h5>Total comic rating</h5>
												<h1><CountUp end={this.state.userStats.comicTotalRating} /></h1>
											</div>
											<div className="user-stat">
												<h5>Average comic rating</h5>
												<h2><CountUp end={this.state.userStats.comicAverageRating} decimals={2}/></h2>
											</div>
											{this.state.userStats && this.state.userStats.topComic
												? <div className="user-stat">
													<h5>Top rated comic</h5>
													{/* TODO, display same as leaderboard row? */}
													<p className="center"><Link to={Util.route.comic(this.state.userStats.topComic.comicId)}>Comic #{this.state.userStats.topComic.comicId}</Link> (rating: {this.state.userStats.topComic.rating})</p> 
												</div>
												: null
											}
										</div>
									</div>
									: <p className="empty-text">User not found.</p>
							}
						</div>
					</div>
				</div>
			</div>
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						{this.state.user && !this.state.isLoading
							? <ComicList 
								sortBy={Util.enums.ComicSortBy.Newest}
								title={`Comics featuring ${this.state.user.username}`} 
								authorUserId={this.state.user.userId} 
							/>
							: null
						}
					</div>
				</div>
			</div>
		</div>;
	}
}