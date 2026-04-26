"use client";

import { useState } from "react";
import { useAuth, User } from "@/lib/auth-context";
import { useAppSettings } from "@/lib/app-settings-context";
import { useShopBranding } from "@/lib/shop-context";
import { uploadShopImage, getCacheBustedUrl } from "@/lib/shop-helpers";

export const SettingsManager = () => {
  const { user, updateUserProfile } = useAuth();
  const { settings, updateSetting, isLoading: settingsLoading } = useAppSettings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isIconEditing, setIsIconEditing] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [adminIcon, setAdminIcon] = useState(user?.icon || "⚙️");
  const [tempIcon, setTempIcon] = useState(adminIcon);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({ name: user?.name || "", email: user?.email || "" });
  const [systemSettings, setSystemSettings] = useState({ enableNotifications: true, enableEmailAlerts: true, maintenanceMode: false });
  const presetIcons = ["⚙️", "👨‍💼", "🔐", "👨‍💻", "🌟", "📊", "🎯"];

  const handleIconChange = (icon: string) => setTempIcon(icon);
  const handleSaveIcon = () => {
    setAdminIcon(tempIcon);
    if (updateUserProfile && user) updateUserProfile({ ...user, icon: tempIcon } as User);
    setIsIconEditing(false);
    showSuccess("Admin icon updated!");
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSaveChanges = () => {
    if (!formData.name || !formData.email) { showError("Fill all fields"); return; }
    if (updateUserProfile && user) updateUserProfile({ ...user, name: formData.name, email: formData.email } as User);
    setIsProfileEditing(false);
    showSuccess("Profile updated!");
  };
  const handleSystemSettingChange = (key: string, value: boolean) => {
    setSystemSettings(p => ({ ...p, [key]: value }));
    showSuccess("System setting updated!");
  };
  const handleAppSettingChange = async (key: string, value: any) => {
    try { await updateSetting(key as any, value); showSuccess(`${key} updated!`); }
    catch { showError("Failed to update"); }
  };
  const showSuccess = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(""), 3000); };
  const showError = (msg: string) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(""), 3000); };

  // Shop Branding Upload Section
  const { branding, isLoading: brandingLoading } = useShopBranding();
  const [uploadingType, setUploadingType] = useState<"logo" | "banner" | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    try {
      await uploadShopImage(file, type);
      showSuccess(`${type === "logo" ? "Logo" : "Banner"} uploaded and synced!`);
    } catch (err: any) {
      showError(err.message || `Failed to upload ${type}`);
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <div className="settings-section">
      <button onClick={() => setIsExpanded(!isExpanded)} className="settings-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "1rem 1.5rem", backgroundColor: "#f8f6f3", border: "none", borderRadius: "8px", width: "100%", fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>
        <span>⚙️ Admin Settings</span>
        <span>{isExpanded ? "−" : "+"}</span>
      </button>

      {isExpanded && (
        <div className="settings-content" style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1.5rem", border: "1px solid #e0d5cc" }}>
          {successMessage && <div style={{ padding: "1rem", backgroundColor: "#d4edda", color: "#155724", borderRadius: "4px", marginBottom: "1rem" }}>✅ {successMessage}</div>}
          {errorMessage && <div style={{ padding: "1rem", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "4px", marginBottom: "1rem" }}>❌ {errorMessage}</div>}

          {/* Icon Settings */}
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e0d5cc" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "0.75rem", color: "#5e584d" }}>Admin Icon</h3>
            <div style={{ fontSize: "2rem", marginBottom: "1rem", padding: "0.5rem" }}>{adminIcon}</div>
            {!isIconEditing ? (
              <button onClick={() => setIsIconEditing(true)} className="btn btn-secondary" style={{ cursor: "pointer" }}>Change Icon</button>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                  {presetIcons.map(icon => (
                    <button key={icon} onClick={() => handleIconChange(icon)} style={{ fontSize: "1.5rem", padding: "0.75rem", border: "none", borderBottom: tempIcon === icon ? "2px solid var(--accent)" : "1px solid #ccc", borderRadius: "4px", cursor: "pointer", backgroundColor: tempIcon === icon ? "#f0e8e0" : "#fff" }}>{icon}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleSaveIcon} className="btn btn-primary" style={{ cursor: "pointer" }}>Save Icon</button>
                  <button onClick={() => { setIsIconEditing(false); setTempIcon(adminIcon); }} className="btn btn-secondary" style={{ cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Settings */}
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e0d5cc" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "1rem", color: "#5e584d" }}>Profile Information</h3>
            {!isProfileEditing ? (
              <>
                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", color: "#666" }}>Name</p>
                  <p style={{ margin: "0", fontSize: "0.95rem", color: "#5e584d", fontWeight: "600" }}>{formData.name}</p>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", color: "#666" }}>Email</p>
                  <p style={{ margin: "0", fontSize: "0.95rem", color: "#5e584d", fontWeight: "600" }}>{formData.email}</p>
                </div>
                <button onClick={() => setIsProfileEditing(true)} className="btn btn-secondary" style={{ cursor: "pointer" }}>Edit Profile</button>
              </>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#5e584d" }}>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Admin Name" style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4ccc3", borderRadius: "4px", fontSize: "0.95rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#5e584d" }}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Admin Email" style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4ccc3", borderRadius: "4px", fontSize: "0.95rem" }} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleSaveChanges} className="btn btn-primary" style={{ cursor: "pointer" }}>Save Changes</button>
                  <button onClick={() => setIsProfileEditing(false)} className="btn btn-secondary" style={{ cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* System Settings */}
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e0d5cc" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "1rem", color: "#5e584d" }}>System Settings</h3>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={systemSettings.enableNotifications} onChange={e => handleSystemSettingChange("enableNotifications", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>🔔 Enable notifications</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={systemSettings.enableEmailAlerts} onChange={e => handleSystemSettingChange("enableEmailAlerts", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>📧 Email alerts</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={systemSettings.maintenanceMode} onChange={e => handleSystemSettingChange("maintenanceMode", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>{systemSettings.maintenanceMode ? "🔧 Maintenance mode (ON)" : "🔧 Maintenance mode"}</span>
            </label>
          </div>

          {/* Shop Branding (Real-time synced) */}
          <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e0d5cc" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "1rem", color: "#5e584d", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🏪 Shop Branding <span style={{ fontSize: "0.75rem", color: "#4caf50", fontWeight: "500" }}>● Live Sync</span>
            </h3>
            {brandingLoading && <p style={{ fontSize: "0.85rem", color: "#999" }}>Loading branding...</p>}

            {/* Logo Upload */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#5e584d", fontWeight: "500" }}>Shop Logo</label>
              {branding.logo_url && (
                <div style={{ marginBottom: "0.75rem", padding: "0.5rem", backgroundColor: "#f9f9f9", borderRadius: "6px", display: "inline-block" }}>
                  <img
                    src={getCacheBustedUrl(branding.logo_url)}
                    alt="Shop Logo"
                    style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "4px" }}
                  />
                </div>
              )}
              <div>
                <label style={{ display: "inline-block", cursor: "pointer", padding: "0.5rem 1rem", backgroundColor: "var(--accent)", color: "white", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "500" }}>
                  {uploadingType === "logo" ? "⏳ Uploading..." : "📁 Upload Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "logo")}
                    disabled={uploadingType === "logo"}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* Banner Upload */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#5e584d", fontWeight: "500" }}>Shop Banner</label>
              {branding.banner_url && (
                <div style={{ marginBottom: "0.75rem", padding: "0.5rem", backgroundColor: "#f9f9f9", borderRadius: "6px" }}>
                  <img
                    src={getCacheBustedUrl(branding.banner_url)}
                    alt="Shop Banner"
                    style={{ width: "100%", maxHeight: "120px", objectFit: "cover", borderRadius: "4px" }}
                  />
                </div>
              )}
              <div>
                <label style={{ display: "inline-block", cursor: "pointer", padding: "0.5rem 1rem", backgroundColor: "var(--accent)", color: "white", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "500" }}>
                  {uploadingType === "banner" ? "⏳ Uploading..." : "📁 Upload Banner"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "banner")}
                    disabled={uploadingType === "banner"}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* App Settings (Real-time synced) */}
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "1rem", color: "#5e584d", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🌐 App Settings <span style={{ fontSize: "0.75rem", color: "#4caf50", fontWeight: "500" }}>● Live Sync</span>
            </h3>
            {settingsLoading && <p style={{ fontSize: "0.85rem", color: "#999" }}>Loading settings...</p>}

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.store_open} onChange={e => handleAppSettingChange("store_open", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>{settings.store_open ? "🟢 Store Open" : "🔴 Store Closed"}</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.maintenance_mode} onChange={e => handleAppSettingChange("maintenance_mode", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>{settings.maintenance_mode ? "🔧 Maintenance Mode (ON)" : "🔧 Maintenance Mode"}</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.enable_notifications} onChange={e => handleAppSettingChange("enable_notifications", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>🔔 Enable Notifications</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.enable_email_alerts} onChange={e => handleAppSettingChange("enable_email_alerts", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>📧 Enable Email Alerts</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.enable_cod} onChange={e => handleAppSettingChange("enable_cod", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>💵 Cash on Delivery (COD)</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.enable_gcash} onChange={e => handleAppSettingChange("enable_gcash", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>💳 GCash Payment</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.enable_paymaya} onChange={e => handleAppSettingChange("enable_paymaya", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>💳 PayMaya Payment</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.2rem", cursor: "pointer" }}>
              <input type="checkbox" checked={settings.enable_bank_transfer} onChange={e => handleAppSettingChange("enable_bank_transfer", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
              <span>🏦 Bank Transfer</span>
            </label>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#5e584d" }}>💸 Delivery Fee (₱)</label>
              <input type="number" value={settings.delivery_fee} onChange={e => handleAppSettingChange("delivery_fee", Number(e.target.value))} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4ccc3", borderRadius: "4px", fontSize: "0.95rem" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#5e584d" }}>📦 Free Shipping Threshold (₱)</label>
              <input type="number" value={settings.free_shipping_threshold} onChange={e => handleAppSettingChange("free_shipping_threshold", Number(e.target.value))} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4ccc3", borderRadius: "4px", fontSize: "0.95rem" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#5e584d" }}>🎯 Discount Percentage (%)</label>
              <input type="number" min="0" max="100" value={settings.discount_percentage} onChange={e => handleAppSettingChange("discount_percentage", Number(e.target.value))} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4ccc3", borderRadius: "4px", fontSize: "0.95rem" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#5e584d" }}>📢 Announcement Banner</label>
              <input type="text" value={settings.announcement_banner} onChange={e => handleAppSettingChange("announcement_banner", e.target.value)} placeholder="Enter announcement text..." style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4ccc3", borderRadius: "4px", fontSize: "0.95rem" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
