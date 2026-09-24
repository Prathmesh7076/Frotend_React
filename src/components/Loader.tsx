import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  className = "",
  label,
}) => {
  const sizeMap = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-slate-200 border-t-primary-600 ${sizeMap[size]}`}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && (
        <span className="text-sm text-slate-500">{label}</span>
      )}
    </div>
  );
};

export const PageLoader: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <div className="flex min-h-[400px] items-center justify-center w-full">
      <Loader size="lg" label={label || "Loading..."} />
    </div>
  );
};

export const ButtonSpinner: React.FC = () => {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
