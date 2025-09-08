
import "./MainResponsiveLayout.scss";
import { useEffect, useState } from "react";
import PowerBIHome from './../PowerBIHome/PowerBIHome'
const MainResponsiveLayout = () => {

  return (
    <div className="application-level">
      <h1>PBI Home Comp</h1>
      <PowerBIHome/>
    </div>
  );
};

export default MainResponsiveLayout;