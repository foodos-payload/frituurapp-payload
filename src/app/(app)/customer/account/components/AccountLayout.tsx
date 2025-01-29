"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShopBranding } from "@/context/ShopBrandingContext";
import LandingHeader from "@/app/(app)/components/LandingHeader";
import Footer from "@/app/(app)/components/Footer";
// If you still want to show your QR code for the customer:
import { QRCodeSVG } from "qrcode.react";

// ---------- Types ----------
type Membership = {
  role?: string;
  points?: number;
  status?: string;
  dateJoined?: string;
  shops?: string[];
};

type CustomerDoc = {
  id: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  barcode?: string; // We'll use this for generating a real QR
  shops?: string[];
  memberships?: Membership[];
};

interface Props {
  shopSlug: string;
  shopData?: any;
}

type ProductDoc = {
  id: string;
  name_nl: string;
  pointscost?: number;
  image?: {
    url?: string;
  };
  // etc. if needed
};

/**
 * Full AccountLayout that:
 * - Displays user info, points, a form to update name/password, logout link.
 * - Fetches & displays "rewardable" products (pointscost>0).
 * - Lets user redeem a product if they have enough points => calls POST /api/redeemProduct.
 * - Re-fetches user doc to update points after redemption.
 */
export default function AccountLayout({ shopSlug, shopData }: Props) {
  const branding = useShopBranding();
  const router = useRouter();

  // ---------- State: Customer + loading/error ----------
  const [customer, setCustomer] = useState<CustomerDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- State: Form (name/password) ----------
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ---------- State: Points + Rewards ----------
  const [totalPoints, setTotalPoints] = useState(0);
  const [rewardProducts, setRewardProducts] = useState<ProductDoc[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);

  // ---------- Modal for redeeming a product ----------
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDoc | null>(null);

  // ---------- Colors from branding ----------
  const ctaColor = branding.primaryColorCTA || "#FFC107";
  const cardBgColor = branding.headerBackgroundColor || "#FFD452";

  // ============================================================
  // 1) On mount, fetch customer doc
  // ============================================================
  useEffect(() => {
    async function fetchDoc() {
      setLoading(true);
      setError(null);
      try {
        const customerID = localStorage.getItem("customerID");
        if (!customerID) {
          router.push("/customer/login");
          return;
        }

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

        // Calculate total points
        const sumPoints =
          doc.memberships?.reduce((acc, m) => acc + (m.points || 0), 0) || 0;
        setTotalPoints(sumPoints);

        // Populate form fields
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

  // ============================================================
  // 2) Fetch "rewardable" products => /api/getRewardProducts?host=<shopSlug>
  // ============================================================
  useEffect(() => {
    if (!shopSlug) return;
    async function fetchRewards() {
      setRewardsLoading(true);
      try {
        const url = `/api/getRewardProducts?host=${shopSlug}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("[fetchRewards] error:", data);
          setRewardProducts([]);
          return;
        }
        const data = await res.json();
        setRewardProducts(data.products || []);
      } catch (err) {
        console.error("[fetchRewards] fetch error:", err);
        setRewardProducts([]);
      } finally {
        setRewardsLoading(false);
      }
    }

    fetchRewards();
  }, [shopSlug]);

  // ============================================================
  // 3) Handle partial update => PATCH /api/customers/<id>
  // ============================================================
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    setError(null);

    try {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Update failed");
      }

      const responseJson = await res.json();
      const updatedDoc: CustomerDoc = responseJson.doc || responseJson;
      setCustomer(updatedDoc);

      // Recalc points
      const sumPoints =
        updatedDoc.memberships?.reduce((acc, m) => acc + (m.points || 0), 0) ||
        0;
      setTotalPoints(sumPoints);

      // Clear password field
      setFirstname(updatedDoc.firstname || "");
      setLastname(updatedDoc.lastname || "");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ============================================================
  // 4) Logout
  // ============================================================
  function handleLogout() {
    localStorage.removeItem("customerID");
    router.push("/customer/login");
  }

  // ============================================================
  // 5) Redeem flow
  // ============================================================
  function handleRedeemClick(prod: ProductDoc) {
    if (totalPoints < (prod.pointscost || 99999999)) {
      alert("Not enough points to redeem this product!");
      return;
    }
    setSelectedProduct(prod);
    setShowModal(true);
  }

  async function confirmRedeem() {
    if (!selectedProduct) return;
    setShowModal(false);

    try {
      const customerID = localStorage.getItem("customerID");
      if (!customerID) {
        alert("No customerID in localStorage, cannot redeem");
        return;
      }

      // If you store the user’s shop ID in the "customer" doc:
      const shopID = (customer?.shops?.length) ? customer.shops[0] : null;

      const body = {
        productId: selectedProduct.id,
        customerID,
        shopID
      };

      const res = await fetch("/api/redeemProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Redeem failed");
      }
      const result = await res.json();
      // e.g. result could be { coupon: { barcode: "...", ...}, updatedPoints: 80 }
      alert(
        `Successfully redeemed "${selectedProduct.name_nl}"! \nCoupon code: ${result.coupon?.barcode}`
      );

      // Update local points or re-fetch the user doc
      // If the API returns updated points:
      if (result.updatedPoints !== undefined) {
        setTotalPoints(result.updatedPoints);
      } else {
        // Or re-fetch the doc to be safe
        refetchCustomer();
      }
    } catch (err: any) {
      console.error("[confirmRedeem] error:", err);
      alert(err.message);
    }
  }

  async function refetchCustomer() {
    if (!customer) return;
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const doc = await res.json();
        setCustomer(doc);
        const sumPoints =
          doc.memberships?.reduce((acc: number, m: any) => acc + (m.points || 0), 0) || 0;
        setTotalPoints(sumPoints);
      }
    } catch (err) {
      console.warn("[refetchCustomer] error:", err);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) return <p className="text-center mt-12">Loading your account...</p>;
  if (error) return <p className="text-center text-red-600 mt-12">{error}</p>;
  if (!customer) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <LandingHeader
        siteTitle={branding.siteTitle}
        logoUrl={branding.logoUrl}
        headerBg={branding.headerBackgroundColor}
        primaryColorCTA={branding.primaryColorCTA}
        branding={branding}
      />

      {/* Main: 2 columns */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col md:flex-row gap-8">
        {/* LEFT COLUMN => Greeting, Points, QR */}
        <section className="md:w-1/2 flex flex-col gap-4 pt-10">
          <div>
            <h2 className="text-2xl font-bold">Hi, {customer.firstname}!</h2>
            <p className="text-gray-600 text-sm">{customer.email}</p>

            <p className="text-xs text-gray-500 mt-2">
              Not {customer.firstname}?{" "}
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={handleLogout}
              >
                Click here to logout
              </button>
            </p>
          </div>

          {/* Points + QR Card */}
          <div className="relative p-4 text-left" style={{ backgroundColor: cardBgColor }}>
            <div className="text-lg font-bold text-gray-800">{totalPoints} punten</div>

            <div className="bg-white inline-block mx-auto p-3 rounded-md mt-6 shadow-md">
              <QRCodeSVG
                value={customer.barcode || "NoBarcodeFound"}
                size={150}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
              />
              <p className="mt-1 text-sm font-medium text-center">
                {customer.barcode || "—"}
              </p>
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-800">
              Scan deze code in de webshop / Kiosk om punten te verzamelen
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN => Update form */}
        <section className="md:w-1/2 flex flex-col mt-10">
          <h3 className="text-lg font-bold mb-2">Update Your Info</h3>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">First Name</label>
              <input
                className="w-full border border-gray-300 rounded-md p-2"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Last Name</label>
              <input
                className="w-full border border-gray-300 rounded-md p-2"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">New Password (optional)</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-md p-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <button
              type="submit"
              className="text-white font-semibold rounded-md py-2 px-4 hover:opacity-90"
              style={{ backgroundColor: ctaColor }}
            >
              Update My Info
            </button>
          </form>
          <hr className="my-6" />
        </section>
      </main>

      {/* ========== REWARDS SECTION ========== */}
      <section className="w-full max-w-5xl mx-auto p-4">
        <h3 className="text-xl font-bold mb-4">Available Rewards</h3>
        {rewardsLoading && <p>Loading reward products...</p>}
        {!rewardsLoading && rewardProducts.length === 0 && (
          <p>No rewardable products found.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {rewardProducts.map((prod) => {
            const canRedeem = totalPoints >= (prod.pointscost || 999999);
            return (
              <div
                key={prod.id}
                className="border rounded-md p-4 flex flex-col items-center"
              >
                {/* Product image */}
                {prod.image?.url ? (
                  <img
                    src={prod.image.url}
                    alt={prod.name_nl}
                    className="max-h-32 mb-2 object-cover"
                  />
                ) : (
                  <div className="h-32 w-full bg-gray-200 flex items-center justify-center mb-2">
                    No image
                  </div>
                )}

                <h4 className="font-semibold mb-1">{prod.name_nl}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {prod.pointscost} points
                </p>
                <button
                  className={`px-4 py-2 rounded-md text-white font-semibold ${canRedeem ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
                  onClick={() => canRedeem && handleRedeemClick(prod)}
                >
                  {canRedeem ? "Redeem" : "Not enough points"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== REDEEM MODAL ========== */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              Redeem {selectedProduct.name_nl}?
            </h3>
            <p className="mb-4">
              This will cost {selectedProduct.pointscost} points. Are you sure?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={confirmRedeem}
                className="px-4 py-2 rounded text-white"
                style={{ backgroundColor: ctaColor }}
              >
                Yes, Redeem
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer branding={branding} shopData={shopData} />
    </div>
  );
}
