import { BarChart3, Boxes, Edit, ImagePlus, Package, Pencil, Plus, Save, Trash2, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api/http";
import { useShop } from "../context/shopStore";
import { formatCurrency } from "../utils/money";

const emptyProduct = {
  title: "",
  description: "",
  mainImg: "",
  carousel: "",
  sizes: "",
  category: "Mobiles",
  gender: "NA",
  price: "",
  discount: "",
  stock: "",
  brand: "",
};

const statuses = ["Order Placed", "Processing", "Shipped", "In Transit", "Delivered", "Cancelled"];

export default function AdminDashboard() {
  const { products, settings, fetchProducts, fetchSettings } = useShop();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [bannerForm, setBannerForm] = useState({
    bannerImage: "",
    bannerTitle: "",
    bannerSubtitle: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", image: "" });
  const [editingCategoryName, setEditingCategoryName] = useState(null);

  const loadAdminData = async () => {
    const [dashboardResponse, ordersResponse, usersResponse] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/orders"),
      api.get("/admin/users"),
    ]);

    setDashboard(dashboardResponse.data.stats);
    setOrders(ordersResponse.data.orders);
    setUsers(usersResponse.data.users);
  };

  useEffect(() => {
    loadAdminData().catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  useEffect(() => {
    if (!settings) return;
    setBannerForm({
      bannerImage: settings.bannerImage || "",
      bannerTitle: settings.bannerTitle || "",
      bannerSubtitle: settings.bannerSubtitle || "",
    });
  }, [settings]);

  const categories = useMemo(() => settings?.categories?.map((category) => category.name) || [
    "Fashion",
    "Electronics",
    "Mobiles",
    "Groceries",
    "Sports Equipment",
  ], [settings]);

  const statCards = [
    { label: "Total users", value: dashboard?.totalUsers || 0, icon: UsersRound },
    { label: "All Products", value: dashboard?.totalProducts || products.length, icon: Boxes },
    { label: "All Orders", value: dashboard?.totalOrders || orders.length, icon: Package },
    { label: "Revenue", value: formatCurrency(dashboard?.totalRevenue || 0), icon: BarChart3 },
  ];

  const updateProductField = (event) => {
    setProductForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        discount: Number(productForm.discount || 0),
        stock: Number(productForm.stock || 0),
        sizes: typeof productForm.sizes === "string"
          ? productForm.sizes.split(",").map((item) => item.trim()).filter(Boolean)
          : productForm.sizes,
        carousel: typeof productForm.carousel === "string"
          ? productForm.carousel.split(",").map((item) => item.trim()).filter(Boolean)
          : productForm.carousel,
      };

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
        setEditingProductId(null);
        setMessage("Product updated");
      } else {
        await api.post("/products", payload);
        setMessage("Product added");
      }
      setProductForm(emptyProduct);
      await fetchProducts();
      await loadAdminData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      title: product.title || "",
      description: product.description || "",
      mainImg: product.mainImg || "",
      carousel: (product.carousel || []).join(", "),
      sizes: (product.sizes || []).join(", "),
      category: product.category || "Mobiles",
      gender: product.gender || "NA",
      price: product.price || "",
      discount: product.discount || "",
      stock: product.stock || "",
      brand: product.brand || "",
    });
    setError("");
    setMessage("");
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProduct);
    setError("");
    setMessage("");
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    await fetchProducts();
    await loadAdminData();
  };

  const startEditCategory = (category) => {
    setEditingCategoryName(category.name);
    setCategoryForm({
      name: category.name,
      image: category.image,
    });
    setError("");
    setMessage("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryName(null);
    setCategoryForm({ name: "", image: "" });
    setError("");
    setMessage("");
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const name = categoryForm.name.trim();
      const image = categoryForm.image.trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      let updatedCategories = [...(settings?.categories || [])];

      if (editingCategoryName) {
        updatedCategories = updatedCategories.map((cat) =>
          cat.name === editingCategoryName ? { name, slug, image } : cat
        );
        setMessage("Category updated");
      } else {
        if (updatedCategories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
          setError("Category with this name already exists");
          return;
        }
        updatedCategories.push({ name, slug, image });
        setMessage("Category added");
      }

      await api.put("/admin/settings", {
        ...settings,
        categories: updatedCategories,
      });

      setCategoryForm({ name: "", image: "" });
      setEditingCategoryName(null);
      await fetchSettings();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const deleteCategory = async (slug) => {
    setError("");
    setMessage("");

    try {
      const updatedCategories = (settings?.categories || []).filter((cat) => cat.slug !== slug);

      await api.put("/admin/settings", {
        ...settings,
        categories: updatedCategories,
      });

      setMessage("Category deleted");
      await fetchSettings();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const updateOrderStatus = async (id, orderStatus) => {
    await api.put(`/admin/orders/${id}/status`, { orderStatus });
    await loadAdminData();
  };

  const saveBanner = async (event) => {
    event.preventDefault();
    await api.put("/admin/settings", {
      siteName: settings?.siteName || "ShopEZ",
      categories: settings?.categories || [],
      ...bannerForm,
    });
    await fetchSettings();
    setMessage("Storefront updated");
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <h1>ShopEZ <span>admin</span></h1>
        {["dashboard", "categories", "orders", "products", "users"].map((tab) => (
          <button
            className={activeTab === tab ? "active" : ""}
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </aside>

      <section className="admin-content">
        <div className="section-heading admin-heading">
          <div>
            <span className="eyebrow">Control center</span>
            <h1>{activeTab === "dashboard" ? "Admin Dashboard" : activeTab}</h1>
          </div>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="form-error">{error}</div>}

        {activeTab === "dashboard" && (
          <>
            <div className="admin-stats">
              {statCards.map(({ label, value, icon: Icon }) => (
                <article className="admin-stat" key={label}>
                  <Icon size={24} />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>

            <form className="admin-form wide" onSubmit={saveBanner}>
              <div className="form-section-title"><ImagePlus size={20} /> Update Banner</div>
              <input
                name="bannerImage"
                value={bannerForm.bannerImage}
                onChange={(event) => setBannerForm((current) => ({ ...current, bannerImage: event.target.value }))}
                placeholder="Banner image URL"
                required
              />
              <input
                name="bannerTitle"
                value={bannerForm.bannerTitle}
                onChange={(event) => setBannerForm((current) => ({ ...current, bannerTitle: event.target.value }))}
                placeholder="Banner title"
              />
              <input
                name="bannerSubtitle"
                value={bannerForm.bannerSubtitle}
                onChange={(event) => setBannerForm((current) => ({ ...current, bannerSubtitle: event.target.value }))}
                placeholder="Banner subtitle"
              />
              <button className="primary-button" type="submit"><Save size={17} /> Update</button>
            </form>
          </>
        )}

        {activeTab === "products" && (
          <section className="admin-products-grid">
            <form className="admin-form" onSubmit={handleProductSubmit}>
              <div className="form-section-title">
                {editingProductId ? <Pencil size={20} /> : <Plus size={20} />}
                {editingProductId ? "Edit Product" : "New Product"}
              </div>
              <input name="title" value={productForm.title} onChange={updateProductField} placeholder="Product name" required />
              <textarea name="description" value={productForm.description} onChange={updateProductField} placeholder="Product description" required />
              <input name="mainImg" value={productForm.mainImg} onChange={updateProductField} placeholder="Thumbnail image URL" required />
              <input name="carousel" value={productForm.carousel} onChange={updateProductField} placeholder="Carousel image URLs, comma separated" />
              <input name="brand" value={productForm.brand} onChange={updateProductField} placeholder="Brand" />
              <select name="category" value={productForm.category} onChange={updateProductField}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <select name="gender" value={productForm.gender} onChange={updateProductField}>
                {["NA", "Men", "Women", "Unisex", "Kids"].map((gender) => <option key={gender}>{gender}</option>)}
              </select>
              <input name="sizes" value={productForm.sizes} onChange={updateProductField} placeholder="Sizes, comma separated" />
              <input name="price" type="number" value={productForm.price} onChange={updateProductField} placeholder="Price" required />
              <input name="discount" type="number" value={productForm.discount} onChange={updateProductField} placeholder="Discount %" />
              <input name="stock" type="number" value={productForm.stock} onChange={updateProductField} placeholder="Stock" />
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="primary-button full" type="submit">
                  {editingProductId ? "Update Product" : "Add Product"}
                </button>
                {editingProductId && (
                  <button className="secondary-button" type="button" onClick={cancelEditProduct}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="admin-list">
              {products.map((product) => (
                <article className="admin-product-row" key={product._id}>
                  <img src={product.mainImg} alt={product.title} />
                  <div>
                    <strong>{product.title}</strong>
                    <p>{product.category} - {formatCurrency(product.price)}</p>
                  </div>
                  <div className="admin-row-actions">
                    <button className="edit-icon" type="button" onClick={() => startEditProduct(product)} aria-label="Edit product">
                      <Edit size={18} />
                    </button>
                    <button className="danger-icon" type="button" onClick={() => deleteProduct(product._id)} aria-label="Delete product">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "categories" && (
          <section className="admin-products-grid">
            <form className="admin-form" onSubmit={handleCategorySubmit}>
              <div className="form-section-title">
                {editingCategoryName ? <Pencil size={20} /> : <Plus size={20} />}
                {editingCategoryName ? "Edit Category" : "New Category"}
              </div>
              <input
                name="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name"
                required
              />
              <input
                name="image"
                value={categoryForm.image}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="Category image URL"
                required
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="primary-button full" type="submit">
                  {editingCategoryName ? "Update Category" : "Add Category"}
                </button>
                {editingCategoryName && (
                  <button className="secondary-button" type="button" onClick={cancelEditCategory}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="admin-list">
              {(settings?.categories || []).map((category) => (
                <article className="admin-product-row" key={category.slug}>
                  <img src={category.image} alt={category.name} style={{ objectFit: "cover" }} />
                  <div>
                    <strong>{category.name}</strong>
                    <p>Slug: {category.slug}</p>
                  </div>
                  <div className="admin-row-actions">
                    <button className="edit-icon" type="button" onClick={() => startEditCategory(category)} aria-label="Edit category">
                      <Edit size={18} />
                    </button>
                    <button className="danger-icon" type="button" onClick={() => deleteCategory(category.slug)} aria-label="Delete category">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "orders" && (
          <div className="admin-list">
            {orders.map((order) => (
              <article className="admin-order-row" key={order._id}>
                <img src={order.items[0]?.mainImg} alt={order.items[0]?.title} />
                <div>
                  <strong>{order.items[0]?.title}</strong>
                  <p>{order.user?.username} - {formatCurrency(order.total)} - {order.paymentMethod}</p>
                  <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                </div>
                <select value={order.orderStatus} onChange={(event) => updateOrderStatus(order._id, event.target.value)}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </article>
            ))}
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-list">
            {users.map((account) => (
              <article className="admin-user-row" key={account._id}>
                <div>
                  <strong>{account.username}</strong>
                  <p>{account.email}</p>
                </div>
                <span>{account.role}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
