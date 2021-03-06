import React, { Component } from 'react';
import Util from '../../../Util';
import { connect } from 'react-redux';
import { closeModal, openModal } from '../../../redux/actions';
import html2canvas from 'html2canvas';

import Button from '../Button/Button';
import ReportComicPanelForm from '../Forms/ReportComicPanelForm/ReportComicPanelForm';
import ComicInfoLabel from '../ComicInfoLabel/ComicInfoLabel';

import ReactSVG from 'react-svg';

class Modal extends Component {
	constructor(props){
		super(props);

		this.close = this.close.bind(this);
	}
	close() {
		this.props.closeModal(this.props.modal.modalId);
	}
	render() {
		let modal = this.props.modal;

		let modalClass = "";
		let modalIcon = null;
		let modalTitle = modal.title;
		let modalContent = modal.content;

		switch(modal.type){
			case Util.enums.ModalType.Alert:
				modalClass = "modal-alert";
				modalContent = <div>
					{modalContent}
					<div className="button-container">
						<Button label={modal.okLabel || 'OK'} onClick={() => {
							this.close();
						}} />
					</div>
				</div>
				break;

			case Util.enums.ModalType.Confirm:
				modalClass = "modal-confirm";
				modalContent = <div>
					{modalContent}
					<div className="button-container justify-end">
						<Button isHollow={true} label={modal.noLabel || 'No'} onClick={() => {
							this.close();
							if(modal.noFn) modal.noFn();
						}} />
						<Button label={modal.yesLabel || 'Yes'} onClick={() => {
							this.close();
							if(modal.yesFn) modal.yesFn();
						}} />
					</div>
				</div>
				break;

			case Util.enums.ModalType.ComicDetailsModal:
				modalTitle = `Comic #${modal.comic.comicId}`;
				modalClass = 'modal-share-comic';

				let comicRoute = Util.route.comic(modal.comic.comicId);

				modalContent = <div className="share-comic-container">
					<ComicInfoLabel className="center" comic={modal.comic} />
					<Button leftIcon={Util.icon.copy} colour="pink" size="lg" label="Copy link" onClick={(e) => {
						Util.fn.copyToClipboard(window.location.origin + Util.route.comic(modal.comic.comicId));
						const span = e.target.getElementsByTagName('span')[0];
						span.innerText = 'Link copied!';
						setTimeout(() => span.innerText = 'Copy link', 3000);
					}} />
					{!Util.route.isCurrently(comicRoute)
						? <Button colour="black" label="View comic page" to={comicRoute} />
						: null
					}
					{Util.context.isAuthenticated()
						? <p className="center sm">See something inappropriate? <a onClick={() => {
							this.close();
							this.props.openModal({
								type: Util.enums.ModalType.ReportComicPanelModal,
								comic: modal.comic
							});
						}}>Report a panel</a>.</p>
						: null
					}
				</div>
				break;

			case Util.enums.ModalType.ReportComicPanelModal:
				modalTitle = `Report panel`;
				modalClass = 'modal-report-comic-panel';
				modalContent = 	<div>
					<div className="report-requirements">
						<p className="center">Please <b>do</b> report a panel if</p>
						<ol>
							<li>it contains offensive language, hate speech or otherwise inappropriate written content, or:</li>
							<li>it <b>intentionally and significantly</b> derails the story in the comic.</li>
						</ol>
						<p className="center"><b>Do not</b> report a panel if</p>
						<ol>
							<li>it attempts to make a silly or anticlimactic joke, or:</li>
							<li>it <b>accidentally or slightly</b> redirects the story in the comic.</li>
						</ol>
						<p className="center">A false report may result in your account being banned.</p>
					</div>
					<ReportComicPanelForm onCancel={() => this.close()}
						formData={{ comic: modal.comic, reportComicPanelId: null }}
						onSubmit={(form, formData) => {
							//Post, but don't set loading, don't await.
							this.close();

							this.props.openModal({
								type: Util.enums.ModalType.Alert,
								title: 'Panel reported',
								content: <p className="center">Your report was submitted.</p>
							});

							Util.api.post('/api/reportComicPanel', {
								comicId: formData.comic.comicId,
								comicPanelId: formData.reportComicPanelId
							});
						}} />
					</div>
				break;

			default:
				break;
		}

		return <div className={`modal ${modalClass}`}>
			{modalTitle || modalIcon 
				? <div className="modal-header">
					{modalIcon ? <ReactSVG className="modal-icon" src={modalIcon} /> : null}
					{modalTitle ? <h3 className="modal-title">{modalTitle}</h3> : null}
					<div className="flex-spacer"></div>
					<ReactSVG className="modal-close-icon" src={Util.icon.cancel} onClick={this.close} />
				</div> 
				: null
			}
			<div className="modal-content">
				{modalContent}
			</div>
		</div>
	}
}

export default connect(null, { closeModal, openModal })(Modal);