export default function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="loading-overlay">
      <div className="loader" aria-label="Loading" />
      {message ? <p className="loading-message">{message}</p> : null}
    </div>
  );
}
