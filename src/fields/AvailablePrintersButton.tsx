"use client";

import React from "react";

const zeroTierURL = process.env.ZNET_LOGIN_IP || 'localhost';

const AvailablePrintersButton: React.FC = () => {
    const handleRedirect = () => {
        window.open(
            `http://${zeroTierURL}:3001/organization/cm5pv3e3u0005pm017bct9yo7/8a1946d1315f6d5b/`,
            "_blank"
        );
    };

    return (
        <div style={{ marginTop: 10 }}>
            <button type="button" onClick={handleRedirect}>
                Show Available Printers
            </button>
        </div>
    );
};

export default AvailablePrintersButton;
