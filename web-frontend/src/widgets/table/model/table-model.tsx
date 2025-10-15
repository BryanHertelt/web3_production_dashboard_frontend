interface TableRow {
  coin: string;
  amount: string;
  buyPrice: string;
  currentPrice: string;
  profitLoss: string;
  profitClass: string;
}

interface TableProps {
  headers: string[];
}

export type { TableRow, TableProps };
