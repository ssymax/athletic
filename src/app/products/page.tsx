import { getProducts } from "@/app/actions/products";
import Link from "next/link";
import { UpdateStockButtons } from "./components/UpdateStockButtons";
import { DeleteProductButton } from "./components/DeleteProductButton";
import { StockInput } from "./components/StockInput";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    redirect("/pos");
  }

  const products = await getProducts();

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1>Produkty i Magazyn</h1>
        {isAdmin && (
          <Link href="/products/new">
            <Button>Dodaj Produkt</Button>
          </Link>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Kategoria</th>
                <th>Cena</th>
                <th>Stan Magazynowy</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Brak produktów.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="font-medium">{product.name}</td>
                    <td>
                      {product.category === "DRINKS"
                        ? "Napoje"
                        : product.category === "SUPPLEMENTS"
                          ? "Suplementy"
                          : product.category}
                    </td>
                    <td>{product.price.toFixed(2)} zł</td>
                    <td>
                      <StockInput id={product.id} stock={product.stock} />
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <UpdateStockButtons id={product.id} />
                        <DeleteProductButton
                          id={product.id}
                          name={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
