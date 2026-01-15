export interface ErrorType {
  code: number;
  name: string;
  detail?: string;
  service?: string;
  flow?: string;
}

// Response from useQuery
export type QueryResponse<T, K extends string> = {
  [key in K]: {
    success: boolean;
    data?: T;
    error?: ErrorType;
  };
};

// Response from a mutation
export interface Response<T, K extends string> {
  data: QueryResponse<T, K>;
}
