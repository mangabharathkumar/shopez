const steps = ["Order Placed", "Processing", "Shipped", "In Transit", "Delivered"];

export default function OrderStatus({ status }) {
  const currentIndex = steps.indexOf(status);

  return (
    <div className="status-steps" aria-label={`Order status ${status}`}>
      {steps.map((step, index) => (
        <span
          className={index <= currentIndex ? "active" : ""}
          key={step}
          title={step}
        />
      ))}
    </div>
  );
}

