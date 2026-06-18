import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useShop } from "../context/shopStore";

const sortOptions = [
  ["popular", "Popular"],
  ["price_asc", "Price low to high"],
  ["price_desc", "Price high to low"],
  ["discount", "Discount"],
  ["newest", "Newest"],
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loadingProducts, fetchProducts, settings } = useShop();
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    gender: searchParams.get("gender") || "",
    sort: searchParams.get("sort") || "popular",
  });

  const categories = settings?.categories || [];

  useEffect(() => {
    const nextFilters = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      gender: searchParams.get("gender") || "",
      sort: searchParams.get("sort") || "popular",
    };
    setFilters(nextFilters);
    fetchProducts(nextFilters).catch(() => {});
  }, [fetchProducts, searchParams]);

  const activeFilterCount = useMemo(() => (
    ["search", "category", "gender"].filter((key) => filters[key]).length
  ), [filters]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, item]) => item && item !== "popular")));
  };

  return (
    <main className="catalog-layout">
      <aside className="filters-panel">
        <div className="filters-heading">
          <SlidersHorizontal size={20} />
          <h2>Filters</h2>
          <span>{activeFilterCount}</span>
        </div>

        <label>
          Search
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Product or brand"
          />
        </label>

        <fieldset>
          <legend>Sort By</legend>
          {sortOptions.map(([value, label]) => (
            <label className="choice" key={value}>
              <input
                type="radio"
                checked={filters.sort === value}
                onChange={() => updateFilter("sort", value)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Categories</legend>
          <label className="choice">
            <input
              type="radio"
              checked={!filters.category}
              onChange={() => updateFilter("category", "")}
            />
            All
          </label>
          {categories.map((category) => (
            <label className="choice" key={category.slug}>
              <input
                type="radio"
                checked={filters.category === category.name}
                onChange={() => updateFilter("category", category.name)}
              />
              {category.name}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Gender</legend>
          {["", "Men", "Women", "Unisex"].map((gender) => (
            <label className="choice" key={gender || "all"}>
              <input
                type="radio"
                checked={filters.gender === gender}
                onChange={() => updateFilter("gender", gender)}
              />
              {gender || "All"}
            </label>
          ))}
        </fieldset>
      </aside>

      <section className="catalog-content">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ShopEZ catalog</span>
            <h1>All Products</h1>
          </div>
          <p>{products.length} items</p>
        </div>

        {loadingProducts ? (
          <div className="loading">Loading products...</div>
        ) : products.length > 0 ? (
          <div className="product-grid catalog-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product._id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">No products matched your filters.</div>
        )}
      </section>
    </main>
  );
}
