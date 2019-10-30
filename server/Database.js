import Sequelize from 'sequelize';
import common from './common';

//Heroku requires pg ssl, and will complain if this isn't set
const pg = require('pg');
pg.defaults.ssl = true;

export default class Database {
	constructor() {
		// I think some of these configs might be excessive, but trying to be safe
		this.connection = new Sequelize(common.config.DatabaseUrl, {
			logging: false,
			ssl: true,
			dialect: 'postgres',
			protocol: 'postgres',
			dialectOptions: {
				ssl: true
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
		
		const getBoooleanNotNull = () => {
			return {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false
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
			TemporarilyBannedAt: Sequelize.DATE,
			TemporarilyBannedCount: getIntegerNotNull(),
			PermanentlyBannedAt: Sequelize.DATE,
			BannedReason: Sequelize.STRING
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
			ValueString: Sequelize.TEXT //A value that can be used for description purposes (eg. your text was "i hate eggs")
		});

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
			TextAlignVertical: Sequelize.INTEGER, //null = bottom 1.bottom, 2.top, 3.middle
			TextAlignHorizontal: Sequelize.INTEGER, //null = middle 1.middle, 2.left, 3.right
			TextColour: Sequelize.INTEGER, //null = black, 1. white
			Ordinal: Sequelize.INTEGER, //optional
			Description: Sequelize.TEXT,

			//Occurance controls (not needed by mapper, just play logic)
			IsNeverLast: getBoooleanNotNull(),
			IsNeverFirst: getBoooleanNotNull(),
			IsOnlyLast: getBoooleanNotNull(), //Implies IsNeverFirst
			IsOnlyFirst: getBoooleanNotNull(), //Implies IsNeverLast
			IsNeverRepeat: getBoooleanNotNull(),
			PreferredPanelGroup: Sequelize.INTEGER, //Panels with the same group will be preferred next (best used with IsNeverRepeat)
		}, true);

		defineTable('Comic', {
			CompletedAt: Sequelize.DATE,
			Token: Sequelize.STRING, //If present, the comic is private
			PanelCount: Sequelize.INTEGER,
			Rating: getIntegerNotNull(),
			LockedAt: Sequelize.DATE, // locked while editing (1 min)

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
		createOneToMany('Comic', 'ComicComment');
		
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
		createOneToMany('User', 'ComicComment');
		createOneToMany('User', 'UserNotification');
		createOneToMany('User', 'ComicPanel');
		createOneToMany('User', 'ComicPanelSkip');
		createOneToMany('User', 'ComicPanelReport');
		
		//Notification FKS
		createOneToMany('Comic', 'Notification'); // Will link to comicid
		createOneToMany('User', 'Notification'); // Will link to user profile
	}
};