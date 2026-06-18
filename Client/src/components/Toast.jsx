import { useShop } from "../context/shopStore";

export default function Toast() {
  const { message } = useShop();

  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}
