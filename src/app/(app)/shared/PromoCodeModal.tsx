"use client";

import React, {
    useState,
    useRef,
    MouseEvent,
    FormEvent,
    useEffect
} from "react";
import { CSSTransition } from "react-transition-group";
import { FiTrash2 } from "react-icons/fi";
import { useShopBranding } from "@/context/ShopBrandingContext";

type ModalStep = "codeInput" | "customerOptions";
type Membership = { points: number; };
type CustomerInfo = {
    firstname: string;
    lastname: string;
    memberships?: Membership[];
};

type PromoCodeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    step: ModalStep;
    customer?: CustomerInfo;
    totalCredits?: number;
    onSubmitCode?: (code: string) => Promise<void>;
    onApplyPoints?: (points: number) => void;
    onRemovePoints?: () => void;
    onApplyCredits?: (amount: number) => void;
    onRemoveCredits?: () => void;
    hasCouponApplied?: boolean;
    onRemoveCoupon?: () => void;
    currentlyUsedPoints?: number;
    currentlyUsedCredits?: number;
    pointsUsed?: number;
};

export default function PromoCodeModal({
    isOpen,
    onClose,
    step,
    customer,
    totalCredits = 0,
    onSubmitCode,
    onApplyPoints,
    onRemovePoints,
    onApplyCredits,
    onRemoveCredits,
    hasCouponApplied = false,
    onRemoveCoupon,
    currentlyUsedPoints = 0,
    currentlyUsedCredits = 0,
}: PromoCodeModalProps) {
    // Refs for fade transitions
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Branding context
    const branding = useShopBranding();

    // For focusing the code input
    const codeInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isOpen && step === "codeInput") {
            codeInputRef.current?.focus();
        }
    }, [isOpen, step]);

    // Local states
    const [code, setCode] = useState("");
    const [pointsToUse, setPointsToUse] = useState<number>(0);
    const [creditsToUse, setCreditsToUse] = useState<number>(0);
    const [extraCode, setExtraCode] = useState("");

    // Handle clicks on the dark overlay => close
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }

    function handleClose() {
        onClose();
        resetModal();
    }

    function resetModal() {
        setCode("");
        setPointsToUse(0);
        setCreditsToUse(0);
        setExtraCode("");
    }

    // Step=codeInput => user enters code
    async function handleSubmitCode(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!code.trim()) return;
        if (onSubmitCode) await onSubmitCode(code.trim());
    }

    // Points logic
    function handleApplyPoints(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!onApplyPoints) return;
        onApplyPoints(pointsToUse);
        setPointsToUse(0);
    }
    function handleRemovePointsClick() {
        onRemovePoints?.();
    }

    // Credits logic
    function handleApplyCredits(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!onApplyCredits) return;
        onApplyCredits(creditsToUse);
        setCreditsToUse(0);
    }
    function handleRemoveCreditsClick() {
        onRemoveCredits?.();
    }

    // Extra code
    async function handleExtraCodeApply(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!extraCode.trim() || !onSubmitCode) return;
        await onSubmitCode(extraCode.trim());
        setExtraCode("");
    }

    // Info from membership
    const membershipPoints = customer?.memberships?.[0]?.points ?? 0;
    const redeemRatio = 100; // Example: increment in steps of 100

    return (
        <>
            {/* Overlay */}
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="fadeOverlay"
                unmountOnExit
                nodeRef={overlayRef}
            >
                <div
                    ref={overlayRef}
                    className="fixed inset-0 bg-black/60 z-[9998] transition-opacity"
                    onClick={handleOverlayClick}
                />
            </CSSTransition>

            {/* Modal container => full screen, scrollable */}
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="fadeModal"
                unmountOnExit
                nodeRef={modalRef}
            >
                <div
                    ref={modalRef}
                    className="
                      fixed inset-0 z-[9999]
                      overflow-y-auto  /* Make it scrollable */
                    "
                >
                    {/* This inner wrapper centers the content on large screens, 
                        but on mobile it can fill the screen */}
                    <div
                        className="
                          flex min-h-full
                          items-center justify-center
                          px-0 py-0 sm:px-4 sm:py-6
                        "
                    >
                        {/* White box => on larger screens, max-w-md; on mobile, full width */}
                        <div
                            className="
                              relative w-full
                              max-w-md
                              bg-white rounded-xl shadow-lg
                              p-5
                            "
                        >
                            {/* Close button (top-right) */}
                            <button
                                onClick={onClose}
                                className="
                                  absolute top-2 right-2
                                  bg-red-600 text-white
                                  rounded-full p-2
                                  shadow
                                  hover:bg-red-700
                                  transition-colors
                                  z-50
                                "
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>

                            {/* STEP 1 => codeInput */}
                            {step === "codeInput" && (
                                <>
                                    <h2 className="text-xl font-semibold mb-4 text-center pt-6">
                                        Enter / Scan Promo code or your customer code
                                    </h2>
                                    <form
                                        onSubmit={handleSubmitCode}
                                        className="flex flex-col gap-4"
                                    >
                                        <input
                                            ref={codeInputRef}
                                            type="text"
                                            className="border rounded-xl p-2 w-full"
                                            placeholder="CUST-12345, SALE15, etc."
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                        />

                                        <button
                                            type="submit"
                                            style={{ backgroundColor: branding.primaryColorCTA }}
                                            className="
                                                bg-green-600 hover:bg-green-700 
                                                text-white font-semibold
                                                p-2 rounded transition-colors
                                            "
                                        >
                                            Apply
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* STEP 2 => customerOptions */}
                            {step === "customerOptions" && (
                                <div className="flex flex-col gap-6 pt-6">
                                    <div className="text-center mb-4">
                                        <h2 className="text-2xl font-semibold mb-2">
                                            Welcome, {customer?.firstname} {customer?.lastname}!
                                        </h2>
                                        <p className="text-base text-gray-600">
                                            You have {membershipPoints} points and more possible rewards below.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Points tile */}
                                        <div className="p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200 flex justify-center text-center w-full">
                                            {hasCouponApplied ? (
                                                <p className="text-base text-gray-600">
                                                    You can’t combine membership points with a coupon/gift code in one order.
                                                </p>
                                            ) : currentlyUsedPoints > 0 ? (
                                                <div className="flex flex-col gap-3">
                                                    <span className="text-base text-gray-700">
                                                        You’re currently using {currentlyUsedPoints} EUR from points.
                                                    </span>
                                                    <button
                                                        onClick={handleRemovePointsClick}
                                                        className="
                                                            bg-red-500 text-white 
                                                            px-4 py-2 rounded
                                                            hover:bg-red-600
                                                        "
                                                    >
                                                        Remove Points
                                                    </button>
                                                </div>
                                            ) : (
                                                <form
                                                    onSubmit={handleApplyPoints}
                                                    className="flex flex-col gap-3"
                                                >
                                                    <label
                                                        htmlFor="pointsToUse"
                                                        className="text-gray-600 font-medium"
                                                    >
                                                        Redeem Points
                                                    </label>

                                                    <div className="flex items-center gap-3 flex-wrap justify-center">
                                                        {/* Trash icon => reset to 0 */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setPointsToUse(0)}
                                                            className="
                                                                text-gray-400 hover:text-red-500 
                                                                transition-colors p-2
                                                            "
                                                            title="Clear Points"
                                                        >
                                                            <FiTrash2 className="w-6 h-6" />
                                                        </button>

                                                        {/* Quantity changer with redeemRatio steps */}
                                                        <div className="flex rounded bg-white text-base leading-none shadow-sm">
                                                            <button
                                                                type="button"
                                                                className="
                                                                    focus:outline-none border-r border 
                                                                    rounded-l border-gray-300 hover:bg-gray-50
                                                                    w-10 h-10 flex items-center justify-center
                                                                "
                                                                onClick={() =>
                                                                    setPointsToUse((prev) =>
                                                                        Math.max(0, prev - redeemRatio)
                                                                    )
                                                                }
                                                            >
                                                                -
                                                            </button>
                                                            <div
                                                                className="
                                                                    flex items-center justify-center 
                                                                    border-y border-gray-300 text-center px-3
                                                                    w-14 text-base
                                                                "
                                                            >
                                                                {pointsToUse}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="
                                                                    focus:outline-none border-l border 
                                                                    hover:bg-gray-50 border-gray-300
                                                                    w-10 h-10 flex items-center justify-center
                                                                "
                                                                onClick={() =>
                                                                    setPointsToUse((prev) =>
                                                                        Math.min(membershipPoints, prev + redeemRatio)
                                                                    )
                                                                }
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        {/* 'Max' button => set to membershipPoints */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setPointsToUse(membershipPoints)}
                                                            className="
                                                                bg-gray-100 hover:bg-gray-200 
                                                                px-3 py-2 rounded text-base
                                                            "
                                                        >
                                                            Max
                                                        </button>

                                                        <button
                                                            type="submit"
                                                            style={{ backgroundColor: branding.primaryColorCTA }}
                                                            className="
                                                                bg-green-600 text-white px-4 py-2 
                                                                rounded hover:bg-green-700
                                                            "
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>

                                                    <small className="text-sm text-gray-400">
                                                        (You have {membershipPoints} points, {redeemRatio} = 1 EUR)
                                                    </small>
                                                </form>
                                            )}
                                        </div>

                                        {/* Additional coupon tile */}
                                        <div className="p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200 text-center flex justify-center w-full">
                                            {currentlyUsedPoints > 0 ? (
                                                <p className="text-base text-gray-600">
                                                    You can’t combine points with another code in one order.
                                                </p>
                                            ) : hasCouponApplied ? (
                                                <div className="flex flex-col gap-3">
                                                    <span className="text-base text-gray-700">
                                                        A coupon or gift code is already applied.
                                                    </span>
                                                    {onRemoveCoupon && (
                                                        <button
                                                            onClick={onRemoveCoupon}
                                                            className="
                                                                bg-red-500 text-white
                                                                px-4 py-2 rounded
                                                                hover:bg-red-600
                                                            "
                                                        >
                                                            Remove Coupon
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <form
                                                    onSubmit={handleExtraCodeApply}
                                                    className="flex flex-col gap-3"
                                                >
                                                    <label
                                                        htmlFor="extraCode"
                                                        className="text-gray-600 font-medium"
                                                    >
                                                        Apply Promo Code
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            id="extraCode"
                                                            type="text"
                                                            className="border p-2 w-full rounded-xl"
                                                            placeholder="COUPON20, GV999..."
                                                            value={extraCode}
                                                            onChange={(e) => setExtraCode(e.target.value)}
                                                        />
                                                        <button
                                                            type="submit"
                                                            style={{ backgroundColor: branding.primaryColorCTA }}
                                                            className="
                                                                bg-green-600 text-white 
                                                                px-4 py-2 rounded 
                                                                hover:bg-green-700
                                                            "
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>

                                        {/* Credits tile */}
                                        <div className="p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200 flex justify-center text-center w-full">
                                            {currentlyUsedCredits > 0 ? (
                                                <div className="flex flex-col gap-3">
                                                    <span className="text-base text-gray-700">
                                                        You have used {currentlyUsedCredits} EUR from credits.
                                                    </span>
                                                    <button
                                                        onClick={handleRemoveCreditsClick}
                                                        className="
                                                            bg-red-500 text-white
                                                            px-4 py-2 rounded
                                                            hover:bg-red-600
                                                        "
                                                    >
                                                        Remove Credits
                                                    </button>
                                                </div>
                                            ) : (
                                                <form onSubmit={handleApplyCredits} className="flex flex-col gap-3">
                                                    <label
                                                        htmlFor="creditsToUse"
                                                        className="text-gray-600 font-medium"
                                                    >
                                                        Redeem Credits
                                                    </label>
                                                    <div className="flex items-center gap-3 flex-wrap justify-center">
                                                        {/* Trash icon => reset to 0 */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setCreditsToUse(0)}
                                                            className="
                                                                text-gray-400 hover:text-red-500 
                                                                transition-colors p-2
                                                            "
                                                            title="Clear Credits"
                                                        >
                                                            <FiTrash2 className="w-6 h-6" />
                                                        </button>

                                                        {/* Plus/minus quantity */}
                                                        <div className="flex rounded bg-white text-base leading-none shadow-sm">
                                                            <button
                                                                type="button"
                                                                className="
                                                                    focus:outline-none border-r border 
                                                                    rounded-l border-gray-300 hover:bg-gray-50
                                                                    w-10 h-10 flex items-center justify-center 
                                                                "
                                                                onClick={() =>
                                                                    setCreditsToUse((prev) => Math.max(0, prev - 1))
                                                                }
                                                            >
                                                                -
                                                            </button>
                                                            <div
                                                                className="
                                                                    flex items-center justify-center 
                                                                    border-y border-gray-300 text-center px-3
                                                                    w-10 text-base
                                                                "
                                                            >
                                                                {creditsToUse}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="
                                                                    focus:outline-none border-l border 
                                                                    hover:bg-gray-50 border-gray-300
                                                                    w-10 h-10 flex items-center justify-center
                                                                "
                                                                onClick={() =>
                                                                    setCreditsToUse((prev) =>
                                                                        Math.min(totalCredits, prev + 1)
                                                                    )
                                                                }
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        {/* 'Max' button => set to totalCredits */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setCreditsToUse(totalCredits)}
                                                            className="
                                                                bg-gray-100 hover:bg-gray-200 
                                                                px-3 py-2 rounded text-base
                                                            "
                                                        >
                                                            Max
                                                        </button>

                                                        <button
                                                            type="submit"
                                                            style={{ backgroundColor: branding.primaryColorCTA }}
                                                            className="
                                                                bg-green-600 text-white 
                                                                px-4 py-2 rounded
                                                                hover:bg-green-700
                                                            "
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                    <small className="text-sm text-gray-400">
                                                        (You have {totalCredits} credits)
                                                    </small>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CSSTransition>
        </>
    );
}
