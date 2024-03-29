import Sequelize from 'sequelize';
import common from './common';

//Heroku requires pg ssl, and will complain if this isn't set
const pg = require('pg');
pg.defaults.ssl = true;

export default class Database {
	constructor() {
		// I think some of these configs might be excessive, but trying to be safe
		this.connection = new Sequelize(common.config.DatabaseUrl, {
			logging: false, // common.config.IsDev,
			ssl: true,
			dialect: 'postgres',
			protocol: 'postgres',
			dialectOptions: {
				ssl: {
					require: true,
					rejectUnauthorized: false
				}
			},
			pool: {
				max: 20,
				min: 0,
				idle: 10000
			}
		});

		this.loadedModels = {};
	}
	get models() {
		return this.loadedModels;
	}
	async SyncSchema() {
		await this.connection.sync({
			//force: true
			alter: true
		});

		console.log('Database sync completed');
	}
	LogError(error) {
		console.log(error);
		
		this.loadedModels.Log.create({
			Type: '500 ERROR',
			Message: error.toString()
		});
	}
	LoadModels() {
		const models = {};

		const defineTable = (name, attributes = {}, isParanoid = false) => {
			let options = isParanoid
				? {
					deletedAt: 'ArchivedAt',
					paranoid: true
				}
				: {};
			
			models[name] = this.connection.define(name, {
				[`${name}Id`]: { //Primary key
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				...attributes
			}, {
				createdAt: 'CreatedAt',
				updatedAt: 'UpdatedAt',
				...options
			});
		};
		
		const getBoooleanNotNull = (defaultValue = false) => {
			return {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: defaultValue
			};
		};
		const getIntegerNotNull = (defaultValue = 0) => {
			return {
				type: Sequelize.INTEGER,
				defaultValue: defaultValue,
				allowNull: false
			}
		};

		defineTable('Log', {
			Type: Sequelize.STRING,
			Message: Sequelize.TEXT
		});

		defineTable('User', {
			Email: Sequelize.STRING,
			Username: Sequelize.STRING,
			Password: Sequelize.STRING,
			VerificationToken: Sequelize.STRING,
			VerificationTokenSetAt: Sequelize.DATE,
			PasswordResetToken: Sequelize.STRING,
			PasswordResetAt: Sequelize.DATE,
			LastLoginAt: Sequelize.DATE,
			IsAdmin: getBoooleanNotNull(),
			AvatarCharacter: Sequelize.INTEGER,
			AvatarExpression: Sequelize.INTEGER,
			AvatarColour: Sequelize.INTEGER,
			AvatarUrl: Sequelize.STRING,
			TemporarilyBannedAt: Sequelize.DATE,
			TemporarilyBannedCount: getIntegerNotNull(),
			PermanentlyBannedAt: Sequelize.DATE,
			BannedReason: Sequelize.STRING,
			LeaderboardTopAt: Sequelize.DATE,
			LeaderboardRating: getIntegerNotNull(),
			GroupInviteToken: Sequelize.STRING
		}, true);

		defineTable('Notification', {
			Type: getIntegerNotNull(1),
			Title: Sequelize.STRING,
			Message: Sequelize.TEXT
		});

		defineTable('UserNotification', {
			SeenAt: Sequelize.DATE,
			ActionedAt: Sequelize.DATE,
			RenewedAt: Sequelize.DATE, //When unseen notifications get updated, this does too. If present, used to override CreatedAt and bump notifications back to top.
			ValueInteger: Sequelize.INTEGER, //A value that can be used for incrementing purposes (eg. "and 34 others") - not to be used as a FK!
			ValueString: Sequelize.TEXT, //A value that can be used for description purposes (eg. your text was "i hate eggs")
			ExpiredAt: Sequelize.DATE //Used to removes/dismisses the notification before it is seen
		});

		defineTable('UserAchievement', {
			Type: Sequelize.INTEGER
		});

		defineTable('Group', {
			Name: Sequelize.STRING,
			Description: Sequelize.TEXT,
			LeaderboardTopAt: Sequelize.DATE,
			LeaderboardRating: getIntegerNotNull(),
			IsPublic: getBoooleanNotNull(),
			AvatarUrl: Sequelize.STRING,
			MemberCount: getIntegerNotNull(0)
		}, true);

		defineTable('GroupUser', {
			GroupAdminAt: Sequelize.DATE, //Becomes bool on client (isGroupAdmin)
			IsFollowing: getBoooleanNotNull(true)
		}, true);

		defineTable('GroupRequest', {
			ApprovedAt: Sequelize.DATE,
			DeniedAt: Sequelize.DATE,
			CancelledAt: Sequelize.DATE,
			Message: Sequelize.TEXT
		});

		defineTable('GroupInvite', {
			AcceptedAt: Sequelize.DATE,
			IgnoredAt: Sequelize.DATE,
			Message: Sequelize.TEXT,
			Token: Sequelize.STRING
		}, true);

		defineTable('GroupChallenge', {
			Challenge: Sequelize.STRING,
			IsDisabled: getBoooleanNotNull()
		}, true);

		defineTable('GroupComment', {
			Value: Sequelize.TEXT
		}, true);

		defineTable('Template', {
			UnlockedAt: Sequelize.DATE,
			Name: Sequelize.STRING,
			Ordinal: Sequelize.INTEGER,
			MaxPanelCount: getIntegerNotNull(8),
			MinPanelCount: getIntegerNotNull(4),
			// DescriptionHtml: Sequelize.TEXT
		}, true);

		defineTable('TemplatePanel', {
			SizeX: Sequelize.INTEGER,
			SizeY: Sequelize.INTEGER,
			PositionX: Sequelize.INTEGER,
			PositionY: Sequelize.INTEGER,
			Image: Sequelize.STRING,
			ImageColour: Sequelize.STRING,
			TextAlignVertical: Sequelize.SMALLINT, //1.(null)bottom, 2.top, 3.middle
			TextAlignHorizontal: Sequelize.SMALLINT, //1.(null)middle, 2.left, 3.right
			TextColour: Sequelize.SMALLINT, //1.(null)black, 2. white
			Ordinal: Sequelize.INTEGER, //optional
			Description: Sequelize.TEXT,

			//Occurance controls (not needed by mapper, just play logic)
			IsNeverLast: getBoooleanNotNull(),
			IsNeverFirst: getBoooleanNotNull(),
			IsOnlyLast: getBoooleanNotNull(), //Implies IsNeverFirst
			IsOnlyFirst: getBoooleanNotNull(), //Implies IsNeverLast
			IsNeverRepeat: getBoooleanNotNull(),

			PanelGroup: Sequelize.SMALLINT, //Used to create preferential/avoidance etc behaviour with other panels
			PanelGroupBehaviour: Sequelize.SMALLINT, //1.(null)prefer, 2.avoid 
			IsOnlyPanelGroupEntry: getBoooleanNotNull(), //Used to make an entry point into a group (good for transitions)
			IsNeverPanelGroupEntry: getBoooleanNotNull(), //Used to only be usable after an entry point to a group (post-transitions)

			AtOrAfterQuartile: Sequelize.INTEGER, // 1, 2, 3, 4 (1 is kinda useless)
			AtOrBeforeQuartile: Sequelize.INTEGER // 1, 2, 3, 4 (4 is kinda useless)
		}, true);

		defineTable('Comic', {
			CompletedAt: Sequelize.DATE,
			PanelCount: Sequelize.INTEGER,
			Rating: getIntegerNotNull(),
			FavouriteCount: getIntegerNotNull(),
			HotRank: {
				type: Sequelize.DECIMAL,
				defaultValue: 0,
				allowNull: false
			},
			LockedAt: Sequelize.DATE, // locked while editing (1 min)
			LeaderboardTopAt: Sequelize.DATE,
			LeaderboardRating: getIntegerNotNull(),

			//Anonymous fields
			IsAnonymous: getBoooleanNotNull(),
			LockedByAnonId: Sequelize.STRING,
			LastAuthorAnonId: Sequelize.STRING,
			
			//Used for display
			Title: Sequelize.STRING //First line of dialogue?
		}, true);

		defineTable('ComicPanel', {
			Ordinal: Sequelize.INTEGER,
			Value: Sequelize.STRING,
			Type: Sequelize.INTEGER, // Enum, eg. 1 'regular', 2 'whisper', 3 'yelling'
			SkipCount: getIntegerNotNull(),
			ReportCount: getIntegerNotNull(),
			CensoredAt: Sequelize.DATE
		}, true);

		defineTable('ComicPanelSkip');

		defineTable('ComicPanelReport');

		defineTable('ComicVote', {
			Value: Sequelize.INTEGER
		});

		defineTable('ComicFavourite', {
			//No additional fields
		}, true);

		defineTable('ComicComment', {
			Value: Sequelize.TEXT
		}, true);
		
		this.loadedModels = models;

		// Associations
		let createOneToMany = (belongsToTableName, hasManyTableName, belongsToAlias, hasManyAlias) => {
			if(!hasManyAlias) hasManyAlias = `${hasManyTableName}s`
			if(!belongsToAlias) belongsToAlias = `${belongsToTableName}`;
		
			let fk = `${belongsToAlias}Id`;

			this.loadedModels[belongsToTableName].hasMany(this.loadedModels[hasManyTableName], { as: hasManyAlias, foreignKey: fk });
			this.loadedModels[hasManyTableName].belongsTo(this.loadedModels[belongsToTableName], { as: belongsToAlias, foreignKey: fk });
		};
		
		createOneToMany('Comic', 'ComicPanel');
		createOneToMany('Comic', 'ComicVote');
		createOneToMany('Comic', 'ComicFavourite')
		createOneToMany('Comic', 'ComicComment');
		createOneToMany('Comic', 'UserAchievement'); // Achievement will link to comicId
		createOneToMany('Comic', 'Notification'); // Notification will link to comicid
		
		createOneToMany('ComicPanel', 'ComicPanelSkip');
		createOneToMany('ComicPanel', 'ComicPanelReport');
		
		createOneToMany('Template', 'TemplatePanel');
		createOneToMany('Template', 'Comic');
		
		createOneToMany('TemplatePanel', 'ComicPanel');
		createOneToMany('TemplatePanel', 'Comic', 'NextTemplatePanel');
		
		createOneToMany('Notification', 'UserNotification');
		
		createOneToMany('User', 'Comic', 'PenultimateAuthorUser', 'PenultimateAuthoredComics');
		createOneToMany('User', 'Comic', 'LastAuthorUser', 'LastAuthoredComics');
		createOneToMany('User', 'Comic', 'LockedByUser', 'LockedComics');
		createOneToMany('User', 'ComicVote');
		createOneToMany('User', 'ComicFavourite');
		createOneToMany('User', 'ComicComment');
		createOneToMany('User', 'UserNotification');
		createOneToMany('User', 'ComicPanel');
		createOneToMany('User', 'ComicPanelSkip');
		createOneToMany('User', 'ComicPanelReport');
		createOneToMany('User', 'UserAchievement');
		createOneToMany('User', 'Notification'); // Notification will link to user profile
		createOneToMany('User', 'Group', 'CreatedByUser', 'CreatedGroups');
		createOneToMany('User', 'GroupUser');
		createOneToMany('User', 'GroupRequest');
		createOneToMany('User', 'GroupRequest', 'ActionedByUser', 'ActionedGroupRequests')
		createOneToMany('User', 'GroupInvite');
		createOneToMany('User', 'GroupInvite', 'InvitedByUser', 'SentGroupInvites');
		createOneToMany('User', 'GroupChallenge', 'CreatedByUser', 'CreatedGroupChallenges');
		createOneToMany('User', 'GroupComment');

		createOneToMany('Group', 'GroupUser');
		createOneToMany('Group', 'GroupRequest');
		createOneToMany('Group', 'GroupInvite');
		createOneToMany('Group', 'GroupChallenge');
		createOneToMany('Group', 'Comic');
		createOneToMany('Group', 'GroupComment');
		createOneToMany('Group', 'Notification'); // Notification will link to groupId
		
		createOneToMany('GroupChallenge', 'Comic');

		console.log('Database: Database models loaded');
	}
};