import 'reflect-metadata';
import { IWelcomeEmailRequestDTO } from '@/modules/notification/contracts/features/welcomeEmailContracts';
import { logger } from '@/shared/utils/logger';
import { INotification, INotificationHandler, notificationHandler } from 'mediatr-ts';

// #region Integration Event

export class WelcomeEmailIntegrationEvent implements INotification {
	constructor(welcomeRequestDTO: IWelcomeEmailRequestDTO) {
		this._fullName = welcomeRequestDTO.fullName;
		this._emailId = welcomeRequestDTO.emailId;
	}

	private _fullName: string;
	public get fullName(): string {
		return this._fullName;
	}

	private _emailId: string;
	public get emailId(): string {
		return this._emailId;
	}
}

@notificationHandler(WelcomeEmailIntegrationEvent)
export class WelcomeEmailIntegrationEventHandler
	implements INotificationHandler<WelcomeEmailIntegrationEvent>
{
	public async handle(notification: WelcomeEmailIntegrationEvent): Promise<void> {
		console.log(
			`Welcome Email Notification Handler: ${notification.fullName} ${notification.emailId}`
		);
	}
}

// #endregion
