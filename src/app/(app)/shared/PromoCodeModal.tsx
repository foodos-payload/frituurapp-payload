"use client";

import React, {
    useState,
    useRef,
    MouseEvent,
    FormEvent,
    useEffect,
} from "react";
import { CSSTransition } from "react-transition-group";

/** 
 * Each step in the modal: 
 *  - "codeInput": the user enters a code 
 *  - "customerOptions": if it's a "CUST-" code and the customer is loaded
 */
type ModalStep = "codeInput" | "customerOptions";

type PromoCodeModalProps = {
    isOpen: boolean;
    onClose: () => void;

    /** 
     * The step of the flow. 
     * The parent decides if we are on 'codeInput' or 'customerOptions'.
     */
    step: ModalStep;

    /** If step === 'customerOptions', pass in the loaded customer. */
    customer?: {
        firstname: string;
        lastname: string;
        memberships?: Array<{ points: number }>;
    };
    /** Available store credits. For example usage. */
    totalCredits?: number;

    /**
     * If step === 'codeInput':
     *  - The user can submit a code. We'll call this parent's function with the code.
     */
    onSubmitCode?: (code: string) => Promise<void>;

    /**
     * If step === 'customerOptions':
     *  - The user can choose how many points or credits to apply. 
     */
    onApplyPoints?: (points: number) => void;
    onApplyCredits?: (amount: number) => void;
};

export default function PromoCodeModal({
    isOpen,
    onClose,
    step,
    customer,
    totalCredits = 0,
    onSubmitCode,
    onApplyPoints,
    onApplyCredits,
}: PromoCodeModalProps) {
    // Refs for CSSTransition
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // State for code input (step 1)
    const [code, setCode] = useState("");

    // State for points/credits usage (step 2)
    const [pointsToUse, setPointsToUse] = useState<number>(0);
    const [creditsToUse, setCreditsToUse] = useState<number>(0);

    // If they close by clicking the overlay
    function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            onClose();
            resetModal();
        }
    }

    /** Clear everything when fully closed. */
    function resetModal() {
        setCode("");
        setPointsToUse(0);
        setCreditsToUse(0);
    }

    /** If the user enters a code (step=codeInput). */
    async function handleSubmitCode(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!code.trim()) return;

        // Let parent handle the logic
        if (onSubmitCode) {
            await onSubmitCode(code.trim());
        }

        // We do NOT automatically close here if it's "CUST-" code. 
        // The parent might change the step to "customerOptions".
        // But if it's a normal coupon, the parent might decide to close the modal.
    }

    /** If user picks how many points to use. */
    function handlePointsApply(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!onApplyPoints) return;
        onApplyPoints(pointsToUse);

        onClose();
        resetModal();
    }

    /** If user picks how many credits to use. */
    function handleCreditsApply(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!onApplyCredits) return;
        onApplyCredits(creditsToUse);

        onClose();
        resetModal();
    }

    /** If user wants to cancel step 2 entirely. */
    function handleCancelStep2() {
        onClose();
        resetModal();
    }

    // Figure out how many points the user actually has:
    const membershipPoints = customer?.memberships?.[0]?.points ?? 0;

    return (
        <>
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="fadeOverlay"
                unmountOnExit
                nodeRef={overlayRef}
            >
                <div
                    ref={overlayRef}
                    className="fixed inset-0 bg-black/50 z-[9998]"
                    onClick={handleOverlayClick}
                />
            </CSSTransition>

            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="fadeModal"
                unmountOnExit
                nodeRef={modalRef}
            >
                <div
                    ref={modalRef}
                    className="fixed inset-0 flex items-center justify-center z-[9999]"
                >
                    <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                            onClick={() => {
                                onClose();
                                resetModal();
                            }}
                        >
                            X
                        </button>

                        {step === "codeInput" && (
                            <>
                                <h2 className="text-xl font-semibold mb-4">Enter Promo / Gift Code</h2>
                                <form onSubmit={handleSubmitCode} className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        className="border rounded p-2"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="e.g. CUST-12345 or GV999 or ABC15"
                                    />
                                    <button type="submit" className="bg-blue-600 text-white p-2 rounded">
                                        Apply
                                    </button>
                                </form>
                            </>
                        )}

                        {step === "customerOptions" && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-xl font-semibold">
                                    Welcome, {customer?.firstname} {customer?.lastname}!
                                </h2>
                                <p className="text-sm text-gray-700">
                                    You have <strong>{membershipPoints}</strong> loyalty points
                                    and <strong>{totalCredits}</strong> store credits.
                                </p>

                                {/* Points usage form */}
                                <form onSubmit={handlePointsApply} className="flex items-center gap-2">
                                    <label htmlFor="pointsToUse" className="whitespace-nowrap">
                                        Use Points:
                                    </label>
                                    <input
                                        id="pointsToUse"
                                        type="number"
                                        className="border p-1 w-16"
                                        min={0}
                                        max={membershipPoints}
                                        value={pointsToUse}
                                        onChange={(e) => setPointsToUse(Number(e.target.value))}
                                    />
                                    <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
                                        Apply
                                    </button>
                                </form>

                                {/* Credits usage form */}
                                <form onSubmit={handleCreditsApply} className="flex items-center gap-2">
                                    <label htmlFor="creditsToUse" className="whitespace-nowrap">
                                        Use Credits:
                                    </label>
                                    <input
                                        id="creditsToUse"
                                        type="number"
                                        className="border p-1 w-16"
                                        min={0}
                                        max={totalCredits}
                                        value={creditsToUse}
                                        onChange={(e) => setCreditsToUse(Number(e.target.value))}
                                    />
                                    <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
                                        Apply
                                    </button>
                                </form>

                                <button
                                    onClick={handleCancelStep2}
                                    className="text-gray-700 underline self-end mt-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </CSSTransition>
        </>
    );
}
