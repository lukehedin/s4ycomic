import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Util from '../../../Util';

import Comic from '../../UI/Comic/Comic';
import ComicList from '../../UI/ComicList/ComicList';
import Button from '../../UI/Button/Button';
import ComicInfoLabel from '../../UI/ComicInfoLabel/ComicInfoLabel';
import ProgressBar from '../../UI/ProgressBar/ProgressBar';

//this.props.comicId
export default class ComicPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			isErrored: false,

			isComicCompleted: false,

			//Incomplete comic
			totalPanelCount: 0,
			completedPanelCount: 0,
			
			//Complete comic
			template: null,
			comic: null
		};
	}
	componentDidMount() {
		this.fetchData();
	}
	getSnapshotBeforeUpdate(prevProps) {
		return this.props.comicId !== prevProps.comicId;
	}
	componentDidUpdate(prevProps, prevState, isNewComicId) {
		if(isNewComicId) this.fetchData();
	}
	fetchData() {
		this.setState({
			isLoading: true,
			isErrored: false,
			isComicCompleted: false,
			totalPanelCount: null,
			completedPanelCount: null,
			comic: null,
			template: null
		});

		Util.api.post('/api/getComicById', {
			comicId: this.props.comicId
		})
		.then(result => {
			if(!result.error) {
				if(result.isComicCompleted) {
					this.setState({
						isComicCompleted: true,
						comic: result.comic,
						template: Util.context.getTemplateById(result.comic.templateId)
					});
				} else {
					this.setState({
						isComicCompleted: false,
						totalPanelCount: result.totalPanelCount,
						completedPanelCount: result.completedPanelCount
					});
				}
			} else {
				this.setState({
					isErrored: true
				});
			}
			this.setState({
				isLoading: false
			})
		})
	}
	render() {
		let content = null;

		if(this.state.isLoading) {
			content = <div className="loader"></div>
		} else if(this.state.isErrored) {
			content = <div>
				<p className="center">The bad news is that the requested comic no longer exists (or doesn't exist yet).</p>
				<p className="center">The good news is that you can help make another one right now!</p>
				<div className="button-container justify-center">
					<Button size="lg" colour="pink" label="Play" to={Util.route.play()} />
				</div>
			</div>
		} else if(this.state.isComicCompleted) {
			content = <div>
				<p className="center"><ComicInfoLabel comic={this.state.comic} /></p>
				{this.state.template
					? <p className="center">Template: <Link to={Util.route.template(this.state.template.templateId)}>{this.state.template.name}</Link></p>
					: null
				}
				<div className="comic-wrapper">
					<Comic isCommentsVisible={true} key={this.state.comic.comicId} comic={this.state.comic} />
				</div>
				<div className="button-container justify-center">
					<Button size="lg" colour="pink" label="Play" to={Util.route.play()} />
				</div>
				<hr />
				<ComicList
					title="Other comics with this template"
					emptyText={`No other comics have been completed with this template.`}
					noMoreText={`Phew! That's all the comics that have been completed using this template.`}
					fetchDelay={700} //Prevent fast nav spamming
					sortBy={Util.enums.ComicSortBy.Random}
					templateId={this.state.comic.templateId}
					ignoreComicIds={[this.props.comicId]}
				/>
			</div>
		} else {
			content = <div>
				<p className="center">This comic is still in progress.</p>
				<ProgressBar 
					total={this.state.totalPanelCount} 
					amount={this.state.completedPanelCount}
					label={`${this.state.completedPanelCount} of ${this.state.totalPanelCount} panels completed`}
				/>
				<p className="center">Why not make a panel for another comic while you wait?</p>	
				<div className="button-container justify-center">
					<Button size="lg" colour="pink" label="Play" to={Util.route.play()} />
				</div>
			</div>
		}
		

		return <div className="page-comic">
			<div className="panel-standard">
				<div className="container">
					<div className="row">
						<h1 className="page-title">Comic #{this.props.comicId}</h1>
						<div className="comic-area">
							{content}
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
}