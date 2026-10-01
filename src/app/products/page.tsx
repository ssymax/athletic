import { getProducts } from "@/app/actions/products";
import Link from "next/link";
import { UpdateStockButtons } from "./components/UpdateStockButtons";
import { DeleteProductButton } from "./components/DeleteProductButton";
import { StockInput } from "./components/StockInput";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function ProductsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    redirect("/pos");
  }

  const t = await getTranslations("products");
  const products = await getProducts();

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1>{t("title")}</h1>
        {isAdmin && (
          <Link href="/products/new">
            <Button>{t("add")}</Button>
          </Link>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("colName")}</th>
                <th>{t("colCategory")}</th>
                <th>{t("colPrice")}</th>
                <th>{t("colStock")}</th>
                <th>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="font-medium">{product.name}</td>
                    <td>
                      {product.category === "DRINKS" ||
                      product.category === "SUPPLEMENTS"
                        ? t(`categories.${product.category}`)
                        : product.category}
                    </td>
                    <td>{t("price", { price: product.price.toFixed(2) })}</td>
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
