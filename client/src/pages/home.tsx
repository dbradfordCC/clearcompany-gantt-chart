import { useState } from "react";
import GanttChart from "@/components/gantt-chart";

export default function Home() {
  const [employeeCount, setEmployeeCount] = useState(750);
  const [companyName, setCompanyName] = useState("TechCorp Solutions");
  const [selectedProduct, setSelectedProduct] = useState("ClearRecruit");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">

        
        <GanttChart
          employeeCount={employeeCount}
          setEmployeeCount={setEmployeeCount}
          companyName={companyName}
          setCompanyName={setCompanyName}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
        />
      </div>
    </div>
  );
}
