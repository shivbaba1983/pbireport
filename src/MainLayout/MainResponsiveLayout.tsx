
import "./MainResponsiveLayout.scss";
import { useEffect, useState } from "react";
import PowerBIHome from './../PowerBIHome/PowerBIHome';
import OracleToDatabricksConverter from './../OracleToDataBricks/OracleToDatabricksConverter ';
const MainResponsiveLayout = () => {

  return (
    <div className="application-level">
      <h1>PBI Home Comp</h1>
      <PowerBIHome/>
      <OracleToDatabricksConverter/>
    </div>
  );
};

export default MainResponsiveLayout;