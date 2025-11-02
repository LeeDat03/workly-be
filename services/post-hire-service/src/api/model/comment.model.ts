export interface IPaginationInput {
    page?: number;
    size?: number;
    args?: IFilterArgs;
}

export interface IFilterArgs {
    id?: number[];
    startAt?: DateString;
    endAt?: DateString;
    keyword?: string;
}
