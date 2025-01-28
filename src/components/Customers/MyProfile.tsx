// File: src/components/Customers/MyProfile.tsx
import React from 'react';
import { useAuth, useDocumentInfo } from 'payload/components/utilities';

const MyProfile: React.FC = () => {
    const { user } = useAuth();
    const { doc } = useDocumentInfo('customers', user?.id); // Fetch the logged-in customer's document

    if (!doc) {
        return <div>Loading your profile...</div>;
    }

    return (
        <div style={{ padding: '1rem' }}>
            <h1>Welcome, {doc.firstname}!</h1>
            <p><strong>Email:</strong> {doc.email}</p>
            <p><strong>First Name:</strong> {doc.firstname}</p>
            <p><strong>Last Name:</strong> {doc.lastname}</p>
            <p><strong>Company:</strong> {doc.company_name || 'N/A'}</p>
        </div>
    );
};

export default MyProfile;
