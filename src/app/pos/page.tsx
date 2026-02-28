"use client";

import { getProducts } from "@/app/actions/products";
import { processSale } from "@/app/actions/pos";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
    });
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.flatMap((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? [{ ...item, quantity: newQty }] : [];
        }
        return [item];
      });
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      await processSale(
        cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod,
      );
      setCart([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      getProducts().then(setProducts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fade-in pos-layout">
      <div className="pos-products">
        <h1 className="mb-6">Sprzedaż</h1>

        <div className="grid grid-cols-3 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className={`card product-tile ${product.stock <= 0 ? "product-tile--out" : ""}`}
              disabled={product.stock <= 0}
            >
              <div>
                <h3 className="mb-1">{product.name}</h3>
                <p className="text-xs text-muted font-medium uppercase tracking-tight">
                  {product.category}
                </p>
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="price-main">
                  {product.price.toFixed(2)} <small>PLN</small>
                </span>
                <span
                  className={`stock-pill ${product.stock < 10 ? "stock-pill--low" : ""}`}
                >
                  Stan: {product.stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card pos-cart">
        <h2 className="mb-6">Koszyk</h2>

        <div className="flex-1 overflow-y-auto mb-6">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div>
                <div className="text-2xl mb-2">🛒</div>
                <p>Koszyk jest pusty</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.price.toFixed(2)} zł x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="quantity-control">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="btn btn-ghost btn-sm"
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="btn btn-ghost btn-sm"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-divider">
          <div className="flex justify-between items-center mb-6">
            <span className="font-medium text-muted">Do zapłaty:</span>
            <span className="total-value">
              {total.toFixed(2)} <small>PLN</small>
            </span>
          </div>

          {error && <div className="alert alert-error mb-4">{error}</div>}

          {success && (
            <div className="alert alert-success mb-4">
              Sprzedaż zakończona pomyślnie!
            </div>
          )}

          <div className="flex flex-col gap-3">
            <select
              className="input-field"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Gotówka</option>
              <option value="CARD">Karta</option>
            </select>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing || success}
              className="btn btn-primary btn-full"
            >
              {processing ? "Przetwarzanie..." : "Zatwierdź i Zapłać"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
