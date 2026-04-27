"use client";

import { useState } from "react";
import { useSeller } from "@/lib/seller-context";
import { SectionHeader } from "@/app/components/ui/section-header";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { EmptyState } from "@/app/components/ui/empty-state";

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
    <Card>
      <SectionHeader
        title="Seller Management"
        subtitle={`${allSellers.length} registered sellers`}
      />

      {allSellers.length === 0 ? (
        <EmptyState icon="🏪" title="No sellers registered yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {allSellers.map((seller) => {
            const stats = getSellerStats(seller.id);
            const products = getSellerProducts(seller.id);
            const isExpanded = expandedSeller === seller.id;

            return (
              <div key={seller.id} className="border border-[var(--line)] rounded-xl bg-[var(--surface)] overflow-hidden">
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-[#faf8f3] transition-colors gap-4"
                  onClick={() => setExpandedSeller(isExpanded ? null : seller.id)}
                >
                  <div className="flex-1">
                    <h3 className="m-0 mb-1 text-lg font-semibold text-[var(--ink)]">{seller.shopName}</h3>
                    <p className="m-0 text-sm text-[#5e584d]">👤 {seller.name}</p>
                    <p className="m-0 text-sm text-[#5e584d]">📧 {seller.email}</p>
                  </div>

                  <div className="flex gap-6 sm:mx-6">
                    <div className="text-center">
                      <p className="m-0 text-xs text-[#5e584d] uppercase tracking-wider">Products</p>
                      <strong className="block text-base mt-1 text-[var(--ink)]">{stats.productCount}</strong>
                    </div>
                    <div className="text-center">
                      <p className="m-0 text-xs text-[#5e584d] uppercase tracking-wider">Total Value</p>
                      <strong className="block text-base mt-1 text-[var(--ink)]">₱{stats.totalRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="text-center">
                      <p className="m-0 text-xs text-[#5e584d] uppercase tracking-wider">Status</p>
                      <strong className={`block text-base mt-1 ${seller.isActive ? "text-[#4caf50]" : "text-[#ff6b6b]"}`}>
                        {seller.isActive ? "Active" : "Inactive"}
                      </strong>
                    </div>
                  </div>

                  <span className="text-sm text-[#5e584d] font-bold">{isExpanded ? "▼" : "▶"}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--line)] p-4 bg-[#faf8f3]">
                    <div className="mb-6">
                      <h4 className="m-0 mb-3 text-sm font-semibold uppercase tracking-wider">Products ({products.length})</h4>
                      {products.length === 0 ? (
                        <EmptyState icon="📦" title="No products listed." />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[var(--surface)]">
                                <th className="text-left p-2 font-semibold">Product Name</th>
                                <th className="text-left p-2 font-semibold">Category</th>
                                <th className="text-left p-2 font-semibold">Price</th>
                                <th className="text-left p-2 font-semibold">Created</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.map((product) => (
                                <tr key={product.id} className="border-b border-[var(--line)]">
                                  <td className="p-2">{product.name}</td>
                                  <td className="p-2">{product.category}</td>
                                  <td className="p-2">₱{product.price.toFixed(2)}</td>
                                  <td className="p-2">{new Date(product.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {seller.isActive ? (
                        <button
                          onClick={() => disableSeller(seller.id)}
                          className="flex-1 px-4 py-2 bg-[#ff6b6b] text-white rounded-md text-sm font-semibold cursor-pointer hover:bg-[#ff5252] transition-colors"
                        >
                          Disable Seller
                        </button>
                      ) : (
                        <button
                          onClick={() => enableSeller(seller.id)}
                          className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-md text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
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
                        className="flex-1 px-4 py-2 bg-[#d32f2f] text-white rounded-md text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
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
    </Card>
  );
}

