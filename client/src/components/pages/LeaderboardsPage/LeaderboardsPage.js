import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import ComicInfoLabel from '../../UI/ComicInfoLabel/ComicInfoLabel';
import Avatar from '../../UI/Avatar/Avatar';
import TabbedPanels from '../../UI/TabbedPanels/TabbedPanels';

export default class LeaderboardsPage extends Component {
	constructor(props){
		super(props);

		this.state = {
			isLoading: true,
			leaderboard: {}
		}
	}
	componentDidMount() {
		Util.api.post('/api/getLeaderboard')
			.then(result => {
				if(!result.error) {
					this.setState({
						leaderboard: result
					});
				}

				this.setState({
					isLoading: false
				})
			});
	}
	render() {
		let leaderboardTabs = [{
			title: 'Comics',
			content: Util.array.any(this.state.leaderboard.comics)
				? <div>
					<p className="page-subtitle">The highest rated comics completed within the past week.</p>
					<table className="leaderboard-table">
						<tbody>
							{this.state.leaderboard.comics.map((leaderboardComic, idx) => {
								let template = Util.referenceData.getTemplateById(leaderboardComic.templateId);
								return <tr key={leaderboardComic.comicId} className="leaderboard-item leaderboard-comic">
									<td>
										<h4>{idx + 1}.</h4>
										<div className="leaderboard-item-detail">
											<h4><Link to={Util.route.comic(leaderboardComic.comicId)}>Comic #{leaderboardComic.comicId}</Link></h4>
											<h4 className="comic-opener">"{leaderboardComic.comicPanels[0].value}"</h4>
											<ComicInfoLabel className="sm" comic={leaderboardComic} />
											<p className="sm rating"><b>Rating</b>: {leaderboardComic.leaderboardRating}</p>
										</div>
									</td>
								</tr>
							})}
						</tbody>
					</table>
				</div>
				: <p className="empty-text align-center">No leaderboard comics to show.</p>
		}, {
			title: 'Users',
			content: Util.array.any(this.state.leaderboard.users)
				? <div>
					<p className="page-subtitle">The users with the highest total rating for comics completed in the past week.</p>
					<table className="leaderboard-table">
						<tbody>
							{this.state.leaderboard.users.map((leaderboardUser, idx) => {
								//TODO: same placement should be reflected in UI
								return <tr key={leaderboardUser.userId} className="leaderboard-item leaderboard-user">
									<td>
										<h4>{idx + 1}.</h4>
										<Avatar size={32} to={Util.route.profile(leaderboardUser.username)} user={leaderboardUser} />
										<div className="leaderboard-item-detail">
											<h4 className="username"><Link to={Util.route.profile(leaderboardUser.username)}>{leaderboardUser.username}</Link></h4>
											<p className="sm rating"><b>Weekly rating</b>: {leaderboardUser.leaderboardRating}</p>
										</div>
									</td>
								</tr>
							})}
						</tbody>
					</table>
				</div>
				: <p className="empty-text align-center">No leaderboard users to show.</p>
		}];

		return <div className="page-leaderboards">
			<div className="panel-inset">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Leaderboards</h1>
						<div className="leaderboards-inner">
							{this.state.isLoading
								? <div className="loader"></div>
								: <div>
									<TabbedPanels tabs={leaderboardTabs} />
									<h6 className="leaderboards-note">Leaderboards and their related achievements are calculated every hour, on the hour.</h6>
								</div>
							}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}