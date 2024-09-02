import { CreateOrganizationController } from './applications/features/v1/activity/createOrganization.Activity';
import { GetOrgByIdController } from './applications/features/v1/activity/getOrgById.Activity';
import { RemoveOrganizationController } from './applications/features/v1/activity/removeOrganization.Activity';

// Module Registration
export const organizationModules: Function[] = [
	CreateOrganizationController,
	GetOrgByIdController,
	RemoveOrganizationController,
];
