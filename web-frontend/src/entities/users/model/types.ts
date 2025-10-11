/**
 * Users type is shape you expect back from the server for each user.
 * @interface Users
 */
export interface Users {
  coin: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
  profitLoss: number;
  profitClass: "profit" | "loss";
}
