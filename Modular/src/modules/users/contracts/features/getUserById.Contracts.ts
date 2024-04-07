// #region Request
export interface IGetUserByIdRequestDTO{
    id:number
}

export class GetUserByIdRequestDTO implements IGetUserByIdRequestDTO{
    id:number;
}

// #endregion

// #region Response
export class GetUserByIdResponseDTO {
    id:number;
    fullName:string;
    email:string;
}
// #endregion