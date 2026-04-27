"use client";

import { useState } from "react";
import { useSeller } from "@/lib/seller-context";

export function SellerManager() {
  const { allSellers, allSellerProducts, disableSeller, enableSeller, deleteSeller, getSellerProducts } =
    useSeller();
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null);

  const getSellerStats = (sellerId: string) => {
    const products = getSellerProducts(sellerId);
    const totalRevenue = products.reduce((sum, p) => sum + p.price, 0);
    return {
      productCount: products.length,
      totalRevenue,
    };
  };

  return (
    <section className="admin-section">
      <div className="section-header">
        <h2>Seller Management ({allSellers.length})</h2>
      </div>

      {allSellers.length === 0 ? (
        <p className="empty-state">No sellers registered yet.</p>
      ) : (
        <div className="sellers-list">
          {allSellers.map((seller) => {
            const stats = getSellerStats(seller.id);
            const products = getSellerProducts(seller.id);
            const isExpanded = expandedSeller === seller.id;

            return (
              <div key={seller.id} className="seller-card">
                <div
                  className="seller-header"
                  onClick={() => setExpandedSeller(isExpanded ? null : seller.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="seller-info">
                    <h3>{seller.shopName}</h3>
                    <p className="seller-name">👤 {seller.name}</p>
                    <p className="seller-email">📧 {seller.email}</p>
                  </div>

                  <div className="seller-stats">
                    <div className="stat">
                      <p>Products</p>
                      <strong>{stats.productCount}</strong>
                    </div>
                    <div className="stat">
                      <p>Total Value</p>
                      <strong>₱{stats.totalRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="stat">
                      <p>Status</p>
                      <strong style={{ color: seller.isActive ? "#4caf50" : "#ff6b6b" }}>
                        {seller.isActive ? "Active" : "Inactive"}
                      </strong>
                    </div>
                  </div>

                  <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
                </div>

                {isExpanded && (
                  <div className="seller-details">
                    <div className="products-section">
                      <h4>Products ({products.length})</h4>
                      {products.length === 0 ? (
                        <p className="empty-state">No products listed.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Product Name</th>
                              <th>Category</th>
                              <th>Price</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((product) => (
                              <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.category}</td>
                                <td>₱{product.price.toFixed(2)}</td>
                                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="seller-actions">
                      {seller.isActive ? (
                        <button
                          onClick={() => disableSeller(seller.id)}
                          className="btn btn-delete"
                        >
                          Disable Seller
                        </button>
                      ) : (
                        <button
                          onClick={() => enableSeller(seller.id)}
                          className="btn btn-primary"
                        >
                          Enable Seller
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete seller "${seller.shopName}" and all their products?`)) {
                            deleteSeller(seller.id);
                          }
                        }}
                        className="btn btn-delete"
                        style={{ background: "#d32f2f" }}
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .sellers-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .seller-card {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface);
          overflow: hidden;
        }

        .seller-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: var(--surface);
          transition: all 0.2s;
        }

        .seller-header:hover {
          background: #faf8f3;
        }

        .seller-info {
          flex: 1;
        }

        .seller-info h3 {
          margin: 0 0 0.25rem;
          font-size: 1.1rem;
          color: var(--ink);
        }

        .seller-name,
        .seller-email {
          margin: 0.15rem 0;
          font-size: 0.85rem;
          color: #5e584d;
        }

        .seller-stats {
          display: flex;
          gap: 1.5rem;
          margin: 0 1.5rem;
        }

        .stat {
          text-align: center;
        }

        .stat p {
          margin: 0;
          font-size: 0.75rem;
          color: #5e584d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat strong {
          display: block;
          font-size: 1rem;
          margin-top: 0.25rem;
          color: var(--ink);
        }

        .expand-icon {
          margin-left: 1rem;
          font-size: 0.8rem;
          color: #5e584d;
        }

        .seller-details {
          border-top: 1px solid var(--line);
          padding: 1rem;
          background: #faf8f3;
        }

        .products-section {
          margin-bottom: 1.5rem;
        }

        .products-section h4 {
          margin: 0 0 0.75rem;
          font-size: 0.95rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .products-section table {
          width: 100%;
          font-size: 0.85rem;
        }

        .products-section th {
          text-align: left;
          font-weight: 600;
          background: var(--surface);
        }

        .seller-actions {
          display: flex;
          gap: 0.5rem;
        }

        .seller-actions button {
          flex: 1;
        }

        @media (max-width: 768px) {
          .seller-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .seller-stats {
            margin: 0.75rem 0 0;
            gap: 1rem;
          }

          .expand-icon {
            margin-left: 0;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </section>
  );
}
