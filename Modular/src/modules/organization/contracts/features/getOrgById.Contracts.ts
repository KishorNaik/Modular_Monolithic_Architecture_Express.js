// #region Request

export interface IGetOrgByIdRequestDTO {
	id: number;
}

export class GetOrgByIdRequestDTO implements IGetOrgByIdRequestDTO {
	id: number;
}

// #endregion

// #region Response
export class GetOrgByIdResponseDTO {
	id: number;
	name: string;
	location: string;
}
// #endregion
