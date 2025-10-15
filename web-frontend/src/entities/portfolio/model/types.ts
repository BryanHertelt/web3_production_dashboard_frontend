/**
 * Users type is shape you expect back from the server for each user.
 * @interface Portfolio
 */
export interface Portfolio {
  id: number;
  owner: string;
  assets: string;
  joined: string;
}
