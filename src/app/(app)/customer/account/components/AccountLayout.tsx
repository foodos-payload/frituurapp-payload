"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShopBranding } from "@/context/ShopBrandingContext";

type Membership = {
  role?: string;
  points?: number;
  status?: string;
  dateJoined?: string;
};

type CustomerDoc = {
  id: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  barcode?: string;
  memberships?: Membership[];
};

interface Props {
  shopSlug: string;
  // If you want to receive "branding" directly as a prop, you could do:
  // branding?: ShopBranding
}

/**
 * A client component that works like OrderLayout:
 * - Grabs the branding with `useShopBranding()`.
 * - Fetches the customer doc in an effect.
 * - Renders the UI for the account page.
 */
export default function AccountLayout({ shopSlug }: Props) {
  // 1) If your entire app is already wrapped in <ShopBrandingProvider>,
  //    we can call the hook to get the branding. 
  //    This is the same approach as "const branding = useShopBranding()" in OrderLayout.
  const branding = useShopBranding();
  console.log("[AccountLayout] branding => ", branding);

  const router = useRouter();

  // 2) States
  const [customer, setCustomer] = useState<CustomerDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local form states
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 3) On mount, fetch doc from /api/customers/:id
  useEffect(() => {
    async function fetchDoc() {
      setLoading(true);
      setError(null);

      try {
        // Suppose we store the doc ID in localStorage after login
        const customerID = localStorage.getItem("customerID");
        if (!customerID) {
          router.push("/customer/login");
          return;
        }

        // Use credentials: "include" => cookie-based auth
        const res = await fetch(`/api/customers/${customerID}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/customer/login");
            return;
          }
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "Error fetching doc");
        }

        const doc: CustomerDoc = await res.json();
        setCustomer(doc);

        // Initialize form
        setFirstname(doc.firstname || "");
        setLastname(doc.lastname || "");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDoc();
  }, [router]);

  // 4) Handle partial update => PATCH /api/customers/<id>
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    setError(null);

    try {
      // Build partial body
      const patchBody: Record<string, any> = {
        firstname,
        lastname,
      };
      if (newPassword) {
        patchBody.password = newPassword;
      }

      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchBody),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Update failed");
      }

      const responseJson = await res.json();
      const updatedDoc: CustomerDoc = responseJson.doc || responseJson;
      setCustomer(updatedDoc);
      setFirstname(updatedDoc.firstname || "");
      setLastname(updatedDoc.lastname || "");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("customerID");
    router.push("/customer/login");
  }

  // 5) Render
  if (loading) return <p>Loading your account...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!customer) return null;

  const totalPoints =
    customer.memberships?.reduce((acc, m) => acc + (m.points || 0), 0) || 0;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      {/* Example usage of branding: */}
      {branding.siteTitle && (
        <h2>{branding.siteTitle} - Account Page</h2>
      )}

      <h1>My Account (Cookie Strategy)</h1>
      <p>Logged in as: {customer.email}</p>
      {customer.barcode && <p>Barcode: {customer.barcode}</p>}
      <p>Points: {totalPoints}</p>

      <form onSubmit={handleUpdate} style={{ marginTop: 20 }}>
        <div>
          <label>First Name:</label>
          <br />
          <input
            style={{ width: "100%", marginBottom: 12 }}
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
        </div>

        <div>
          <label>Last Name:</label>
          <br />
          <input
            style={{ width: "100%", marginBottom: 12 }}
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
        </div>

        <div>
          <label>New Password (optional):</label>
          <br />
          <input
            type="password"
            style={{ width: "100%", marginBottom: 12 }}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Update My Info</button>
      </form>

      <hr style={{ margin: "20px 0" }} />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
