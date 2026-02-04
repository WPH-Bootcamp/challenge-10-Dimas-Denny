export interface ILoginPayLoad {
  email: string;
  password: string;
}

export interface ILoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}
