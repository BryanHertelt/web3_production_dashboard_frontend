import React from "react";
import InfoBox from "@/shared/ui/info-box";

const summaryData = [
  {
    title: "Revenue",
    value: "$25,680",
    change: "+8%",
    color: "bg-purple-500",
  },
  {
    title: "Transactions",
    value: "$18,420",
    change: "+5%",
    color: "bg-blue-400",
  },
  {
    title: "Refunds",
    value: "$3,260",
    change: "-2%",
    color: "bg-orange-400",
  },
  {
    title: "USD balance",
    value: "$25,680",
  },
  {
    title: "Pending payouts",
    value: "$12,340",
  },
];

const InfoBoxes: React.FC = () => {
  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {summaryData.map(({ title, value, change, color }, idx) => {
        let footer = null;
        if (!change && title === "USD balance") {
          footer = (
            <button className="mt-2 w-full border border-gray-300 rounded py-1 text-sm">
              Withdraw balance
            </button>
          );
        } else if (!change && title === "Pending payouts") {
          footer = (
            <>
              <div className="mt-2 text-sm">Expected:</div>
              <button className="mt-1 w-full border border-gray-300 rounded py-1 text-sm">
                View more
              </button>
            </>
          );
        }
        return (
          <InfoBox
            key={idx}
            title={title}
            value={value}
            change={change}
            color={color}
            footer={footer}
          />
        );
      })}
    </div>
  );
};

export default InfoBoxes;
