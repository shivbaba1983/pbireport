

import { useEffect, useState } from "react";
import PowerBIEmbed from './../PowerBIEmbed/PowerBIEmbed'
const PowerBIHome = () => {

    return (
        <div className="">
            <PowerBIEmbed
                embedUrl="https://app.powerbi.com/reportEmbed?reportId=xxx&groupId=yyy"
                accessToken="<<embed token from backend>>"
                reportId="xxx"
            />
        </div>
    );
};

export default PowerBIHome;