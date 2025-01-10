"use client";

import React from "react";
// IMPORTANT: Import from 'payload/components/forms', not '@payloadcms/ui'
import { useWatchForm } from '@payloadcms/ui';

const PrinterPortalButton: React.FC = () => {
    // 1. Use `useWatchForm` to access form state
    const { getDataByPath } = useWatchForm();

    // 2. Retrieve the in-progress value of `zerotierIP`
    const zerotierIP: string = getDataByPath('zerotierIP');

    const handleRedirect = () => {
        if (!zerotierIP) {
            alert("Please enter a ZeroTier IP before using the Setup Portal.");
            return;
        }
        // 3. Open the unsaved value in a new tab
        window.open(`https://${zerotierIP}:631`, "_blank");
    };

    return (
        <div style={{ marginTop: 10 }}>
            <button type="button" onClick={handleRedirect}>
                Go to Printer Setup Portal
            </button>
        </div>
    );
};

export default PrinterPortalButton;
