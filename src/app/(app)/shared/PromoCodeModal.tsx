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
import { FiX } from "react-icons/fi";
import { useTranslation } from "@/context/TranslationsContext";

type ModalStep = "codeInput" | "customerOptions";
type Membership = { points: number };
type CustomerInfo = {
    firstname: string;
    lastname: string;
    memberships?: Membership[];
};

type PromoCodeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    step: ModalStep;
    /** If kiosk => bigger modal container & text. */
    isKiosk?: boolean;
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
};

export default function PromoCodeModal({
    isOpen,
    onClose,
    step,
    isKiosk = false,
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
    const { t } = useTranslation();
    // Refs for fade transitions
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Branding context (optional)
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

    // Local spinner states for each “apply” action
    const [promoLoading, setPromoLoading] = useState<"idle" | "loading">("idle");
    const [pointsLoading, setPointsLoading] = useState<"idle" | "loading">("idle");
    const [creditsLoading, setCreditsLoading] = useState<"idle" | "loading">("idle");

    // membershipPoints => from user membership
    const membershipPoints = customer?.memberships?.[0]?.points ?? 0;
    const redeemRatio = 100; // Example: 100 points = 1 EUR

    /** Overlay click => close */
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
        setPromoLoading("idle");
        setPointsLoading("idle");
        setCreditsLoading("idle");
    }

    // Step=codeInput => user enters code
    async function handleSubmitCode(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!code.trim() || !onSubmitCode) return;

        setPromoLoading("loading");
        await onSubmitCode(code.trim());
        setPromoLoading("idle");
    }

    // Points logic
    async function handleApplyPointsForm(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!onApplyPoints) return;

        setPointsLoading("loading");
        try {
            onApplyPoints(pointsToUse);
        } finally {
            setPointsLoading("idle");
        }
        setPointsToUse(0);
    }
    function handleRemovePointsClick() {
        onRemovePoints?.();
    }

    // Credits logic
    async function handleApplyCreditsForm(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!onApplyCredits) return;

        setCreditsLoading("loading");
        try {
            onApplyCredits(creditsToUse);
        } finally {
            setCreditsLoading("idle");
        }
        setCreditsToUse(0);
    }
    function handleRemoveCreditsClick() {
        onRemoveCredits?.();
    }

    // Extra code
    async function handleExtraCodeApply(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!extraCode.trim() || !onSubmitCode) return;

        setPromoLoading("loading");
        try {
            await onSubmitCode(extraCode.trim());
        } finally {
            setPromoLoading("idle");
        }
        setExtraCode("");
    }

    // Kiosk-based classes
    const kioskModalWidth = isKiosk ? "max-w-3xl" : "max-w-md";
    const kioskTitleClass = isKiosk ? "text-3xl" : "text-xl";
    const kioskSubTitleClass = isKiosk ? "text-xl" : "text-base";
    const kioskPadding = isKiosk ? "p-8" : "p-5";
    const kioskTextClass = isKiosk ? "text-xl" : "text-base";

    // Buttons, labels, small text
    const kioskActionButtonClass = isKiosk ? "text-xl px-6 py-3" : "text-base px-4 py-2";
    const kioskLabelClass = isKiosk ? "text-xl font-medium" : "text-base font-medium";
    const kioskSmallTextClass = isKiosk ? "text-lg" : "text-sm";

    // For minus/plus
    const kioskQtyBtnClass = isKiosk ? "w-12 h-12 text-xl" : "w-10 h-10 text-base";
    // For the "Max" button
    const kioskMaxBtnClass = isKiosk ? "px-5 py-3 text-xl" : "px-3 py-2 text-base";
    // For the "Trash" icon
    const kioskTrashClass = isKiosk ? "w-8 h-8" : "w-6 h-6";
    // For the code input
    const kioskInputPadding = isKiosk ? "p-4" : "p-2";

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
            overflow-y-auto 
          "
                >
                    <div
                        className="
              flex min-h-full
              items-center justify-center
              px-2 py-2 sm:px-4 sm:py-6
            "
                    >
                        <div
                            className={`
                relative w-full
                ${kioskModalWidth}
                bg-white rounded-xl shadow-lg
                ${kioskPadding}
              `}
                        >
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                title="Close Modal"
                                className="
    absolute
    top-2 right-2
    bg-red-500
    text-white
    rounded-xl
    shadow-xl
    p-3
    hover:bg-red-600
    transition-colors
    z-50
  "
                                style={{ minWidth: "44px", minHeight: "44px" }}
                            >
                                <FiX className="w-6 h-6" />
                            </button>

                            {/* STEP 1 => codeInput */}
                            {step === "codeInput" && (
                                <>
                                    <h2 className={`${kioskTitleClass} font-semibold mb-4 text-center pt-6`}>
                                        {t("promotion.title")}
                                    </h2>
                                    <form onSubmit={handleSubmitCode} className="flex flex-col gap-4">
                                        <input
                                            ref={codeInputRef}
                                            type="text"
                                            className={`
                        ${kioskTextClass}
                        border rounded-xl w-full
                        ${kioskInputPadding}
                      `}
                                            placeholder="CUST-12345, SALE15, etc."
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                        />

                                        <button
                                            type="submit"
                                            disabled={promoLoading === "loading"}
                                            style={{ backgroundColor: branding.primaryColorCTA || "#068b59" }}
                                            className={`
                        ${kioskActionButtonClass}
                        w-full
                        text-white font-semibold
                        rounded transition-colors
                        disabled:opacity-50
                      `}
                                        >
                                            {promoLoading === "loading" ? <SpinnerIcon /> : t("promotion.apply")}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* STEP 2 => customerOptions */}
                            {step === "customerOptions" && (
                                <div className="flex flex-col gap-6 pt-6">
                                    <div className="text-center mb-4">
                                        <h2 className={`${kioskTitleClass} font-semibold mb-2`}>
                                            Welcome, {customer?.firstname} {customer?.lastname}!
                                        </h2>
                                        <p className={`${kioskSubTitleClass} text-gray-600`}>
                                            You have {membershipPoints} points.
                                        </p>
                                    </div>

                                    <div className="space-y-6">


                                        {/* Additional coupon tile */}
                                        <div
                                            className={`
                        p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200
                        text-center flex justify-center w-full
                        ${kioskTextClass}
                      `}
                                        >
                                            {currentlyUsedPoints > 0 ? (
                                                <p className={kioskSubTitleClass}>
                                                    You can’t combine points with another code in one order.
                                                </p>
                                            ) : hasCouponApplied ? (
                                                <div className="flex flex-col gap-3">
                                                    <span className={`${kioskTextClass} text-gray-700`}>
                                                        A coupon or gift code is already applied.
                                                    </span>
                                                    {onRemoveCoupon && (
                                                        <button
                                                            onClick={onRemoveCoupon}
                                                            className={`
                                ${kioskActionButtonClass}
                                bg-red-500 text-white
                                rounded hover:bg-red-600
                              `}
                                                        >
                                                            Remove Coupon
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <form onSubmit={handleExtraCodeApply} className="flex flex-col gap-3">
                                                    <label
                                                        htmlFor="extraCode"
                                                        className={`${kioskLabelClass} text-gray-600`}
                                                    >
                                                        {t("order.cart.promo_code")}
                                                    </label>
                                                    <div className="flex items-center gap-3 flex-wrap justify-center">
                                                        <input
                                                            id="extraCode"
                                                            type="text"
                                                            className={`
                                border rounded-xl w-full
                                ${kioskTextClass}
                                ${kioskInputPadding}
                              `}
                                                            placeholder="COUPON20, GV999..."
                                                            value={extraCode}
                                                            onChange={(e) => setExtraCode(e.target.value)}
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={promoLoading === "loading"}
                                                            style={{ backgroundColor: branding.primaryColorCTA || "#068b59" }}
                                                            className={`
                                ${kioskActionButtonClass}
                                text-white rounded
                                hover:opacity-90
                                disabled:opacity-50
                              `}
                                                        >
                                                            {promoLoading === "loading" ? <SpinnerIcon /> : t("promotion.apply")}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>

                                        {/* Credits tile */}
                                        <div
                                            className={`
                        p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200
                        flex justify-center text-center w-full
                        ${kioskTextClass}
                      `}
                                        >
                                            {currentlyUsedCredits > 0 ? (
                                                <div className="flex flex-col gap-3">
                                                    <span className={`${kioskTextClass} text-gray-700`}>
                                                        You have used {currentlyUsedCredits} EUR from credits.
                                                    </span>
                                                    <button
                                                        onClick={handleRemoveCreditsClick}
                                                        className={`
                              ${kioskActionButtonClass}
                              bg-red-500 text-white
                              rounded hover:bg-red-600
                            `}
                                                    >
                                                        Remove Credits
                                                    </button>
                                                </div>
                                            ) : (
                                                <form onSubmit={handleApplyCreditsForm} className="flex flex-col gap-3">
                                                    <label
                                                        htmlFor="creditsToUse"
                                                        className={`${kioskLabelClass} text-gray-600`}
                                                    >
                                                        Redeem Credits
                                                    </label>
                                                    <div className="flex items-center gap-3 flex-wrap justify-center">
                                                        {/* Trash icon to reset credits */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setCreditsToUse(0)}
                                                            className="
                                text-gray-400 hover:text-red-500 
                                transition-colors p-2
                              "
                                                            title="Clear Credits"
                                                        >
                                                            <FiTrash2 className={`${kioskTrashClass}`} />
                                                        </button>

                                                        {/* minus/plus */}
                                                        <div
                                                            className="
                                flex rounded bg-white text-base leading-none shadow-sm
                              "
                                                        >
                                                            <button
                                                                type="button"
                                                                className={`
                                  focus:outline-none border-r border
                                  rounded-l border-gray-300 hover:bg-gray-50
                                  ${kioskQtyBtnClass}
                                  flex items-center justify-center
                                `}
                                                                onClick={() => setCreditsToUse((prev) => Math.max(0, prev - 1))}
                                                            >
                                                                -
                                                            </button>
                                                            <div
                                                                className="
                                  flex items-center justify-center
                                  border-y border-gray-300 text-center px-3
                                  w-10
                                "
                                                            >
                                                                <span className={`${kioskTextClass}`}>{creditsToUse}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className={`
                                  focus:outline-none border-l border
                                  hover:bg-gray-50 border-gray-300
                                  ${kioskQtyBtnClass}
                                  flex items-center justify-center
                                `}
                                                                onClick={() =>
                                                                    setCreditsToUse((prev) => Math.min(totalCredits, prev + 1))
                                                                }
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        {/* Max button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setCreditsToUse(totalCredits)}
                                                            className={`
                                bg-gray-100 hover:bg-gray-200
                                rounded
                                ${kioskMaxBtnClass}
                              `}
                                                        >
                                                            Max
                                                        </button>

                                                        {/* Apply button */}
                                                        <button
                                                            type="submit"
                                                            disabled={creditsLoading === "loading"}
                                                            style={{ backgroundColor: branding.primaryColorCTA || "#068b59" }}
                                                            className={`
                                ${kioskActionButtonClass}
                                text-white rounded
                                hover:opacity-90
                                disabled:opacity-50
                              `}
                                                        >
                                                            {creditsLoading === "loading" ? <SpinnerIcon /> : t("promotion.apply")}
                                                        </button>
                                                    </div>
                                                    <small className={`${kioskSmallTextClass} text-gray-400`}>
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

/** A simple spinner icon (SVG) */
function SpinnerIcon() {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="animate-spin mx-auto"
            strokeWidth="3"
            fill="none"
            stroke="currentColor"
        >
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path d="M12 2 A10 10 0 0 1 22 12" className="opacity-75" />
        </svg>
    );
}
