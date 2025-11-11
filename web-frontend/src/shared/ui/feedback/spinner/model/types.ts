export interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: string;
}

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}
