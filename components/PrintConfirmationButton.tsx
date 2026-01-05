"use client";

export default function PrintConfirmationButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
    >
      Print Confirmation
    </button>
  );
}
