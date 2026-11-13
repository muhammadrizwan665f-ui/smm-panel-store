import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Database,
  ArrowRight,
  X,
} from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  importServices,
  syncServiceLimits,
  getDefaultServiceMarkup,
  saveDefaultServiceMarkup,
} from "@/lib/providers/import.functions";
import { getProviderServices } from "@/lib/providers/provider.functions";
import { getCurrencySettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/management/providers/$id/services")({
  component: ProviderServices,
});

function ProviderServices() {
  const { id } = useParams({
    from: "/management/providers/$id/services",
  });

  const [services, setServices] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [syncingLimits, setSyncingLimits] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
  const [currencySettings, setCurrencySettings] = React.useState<any>(null);

  const [defaultMarkup, setDefaultMarkup] = React.useState({
    markupType: "percentage" as "fixed" | "percentage",
    markupAmount: 20,
  });
  const [savingMarkup, setSavingMarkup] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState<any>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importLoading, setImportLoading] = React.useState(false);

  const [importConfig, setImportConfig] = React.useState({
    markupType: "percentage" as "fixed" | "percentage",
    markupAmount: 20,
    categoryId: "",
    createNewCategory: "",
    parentCategoryId: "",
  });

  const fetchData = async () => {
    setLoading(true);
    console.log(`[UI] Loading services for provider ${id}...`);

    try {
      const servicesPromise = supabase
        .from("provider_services")
        .select("*", { count: "exact" })
        .eq("provider_id", id)
        .order("provider_service_id", { ascending: true });

      const categoriesPromise = supabase
        .from("service_categories")
        .select("*")
        .order("name");

      const [servicesRes, catsRes] = await Promise.all([
        servicesPromise,
        categoriesPromise,
      ]);

      if (servicesRes.error) {
        console.error("[UI] Services error:", servicesRes.error);
        toast.error("Services error: " + servicesRes.error.message);
      } else {
        console.log("[UI] Services loaded:", servicesRes.data?.length);
        setServices(servicesRes.data || []);
      }

      if (catsRes.error) {
        console.error("[UI] Categories error:", catsRes.error);
        toast.error("Categories error: " + catsRes.error.message);
      } else {
        setCategories(catsRes.data || []);
      }

      try {
        const settingsRes = await getCurrencySettings();
        const parsed =
          typeof settingsRes === "string"
            ? JSON.parse(settingsRes)
            : settingsRes;

        setCurrencySettings(parsed);
      } catch (error) {
        console.error("[UI] Currency settings error:", error);
        setCurrencySettings(null);
      }

      try {
        const markupRes = await getDefaultServiceMarkup();
        const markupParsed =
          typeof markupRes === "string"
            ? JSON.parse(markupRes)
            : markupRes;

        setDefaultMarkup({
          markupType: markupParsed.markupType,
          markupAmount: markupParsed.markupAmount,
        });

        setImportConfig((prev) => ({
          ...prev,
          markupType: markupParsed.markupType,
          markupAmount: markupParsed.markupAmount,
        }));
      } catch (error) {
        console.error("Default markup settings error:", error);
      }
    } catch (error: any) {
      console.error("[UI] Fetch data error:", error);
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [id]);

  const handleFetchServices = async () => {
    setIsFetching(true);

    try {
      console.log(`[UI] Fetching services for provider ${id}`);

      const result = await getProviderServices({
        data: { providerId: id },
      });

      const parsed =
        typeof result === "string" ? JSON.parse(result) : result;

      if (parsed.success) {
        toast.success(
          `Fetched ${parsed.received} services. Stored/Updated: ${parsed.stored}`
        );
        await fetchData();
      } else {
        const errorMsg = parsed.message || "Failed to fetch services";

        console.error("[UI] Fetch error:", parsed);

        toast.error(errorMsg, {
          description: parsed.stage
            ? `Failed at ${parsed.stage} stage`
            : undefined,
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("[UI] Fatal fetch error:", error);
      toast.error("Error fetching services: " + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggleSelect = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((item) => item !== serviceId)
        : [...prev, serviceId]
    );
  };

  const filteredServices = services.filter(
    (service) =>
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.provider_service_id?.toString().includes(searchTerm)
  );

  const handleSelectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(
        filteredServices.map((service) =>
          String(service.provider_service_id)
        )
      );
    }
  };

  const handleSyncLimits = async () => {
    setSyncingLimits(true);

    try {
      const result = await syncServiceLimits({
        data: { providerId: id },
      });

      const parsed =
        typeof result === "string" ? JSON.parse(result) : result;

      if (parsed.success) {
        toast.success(parsed.message);
      } else {
        toast.error(
          "Sync failed: " + (parsed.message || "Unknown error")
        );
      }
    } catch (error: any) {
      toast.error("Sync error: " + error.message);
    } finally {
      setSyncingLimits(false);
    }
  };

  // Existing manual import
  const executeImport = async () => {
    setImportLoading(true);

    try {
      const result = await importServices({
        data: {
          providerId: id,
          serviceIds: selectedServices,
          ...importConfig,
        },
      });

      const parsed =
        typeof result === "string" ? JSON.parse(result) : result;

      if (parsed.success) {
        toast.success(
          `Imported ${parsed.importedCount} | Updated ${parsed.updatedCount}`
        );

        setShowImportModal(false);
        setSelectedServices([]);
        await fetchData();
      } else {
        toast.error(
          "Import failed: " + (parsed.message || "Unknown error")
        );
      }
    } catch (error: any) {
      toast.error("Import error: " + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Import all services and automatically categorize them
  const handleAutoImport = async () => {
    if (!services.length) {
      toast.error("No provider services available. Fetch services first.");
      return;
    }

    setImportLoading(true);

    try {
      const result = await importServices({
        data: {
          providerId: id,
          markupType: importConfig.markupType,
          markupAmount: importConfig.markupAmount,
          autoCategorize: true,
        },
      });

      const parsed =
        typeof result === "string" ? JSON.parse(result) : result;

      if (parsed.success) {
        toast.success(
          `Imported: ${parsed.importedCount} | Updated: ${parsed.updatedCount} | Unmatched: ${parsed.unmatchedCount}`
        );

        setSelectedServices([]);
        await fetchData();
      } else {
        toast.error(parsed.message || "Auto import failed.");
      }
    } catch (error: any) {
      toast.error("Auto import error: " + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  const calculatePreview = (providerRate: number) => {
    if (!currencySettings) {
      return {
        cost: "0.00",
        price: "0.00",
        usdt: "0.00",
        symbol: "$",
      };
    }

    const usdtExchangeRate = parseFloat(
      currencySettings.usdt_rate || "280"
    );

    const usdtToInr = parseFloat(
      currencySettings.usdt_to_inr || "280"
    );

    let providerCurrency = "USDT";

    const sampleService = services.find(
      (service) =>
        String(service.provider_service_id) === selectedServices[0]
    );

    if (sampleService?.provider_currency) {
      providerCurrency = sampleService.provider_currency;
    } else if (providerRate > 0.5) {
      providerCurrency = "PKR";
    }

    let usdtCost = providerRate;

    if (providerCurrency === "PKR") {
      usdtCost = providerRate / usdtToInr;
    }

    const internalCost = usdtCost * usdtExchangeRate;

    let customerPrice = internalCost;

    if (importConfig.markupType === "percentage") {
      customerPrice =
        internalCost * (1 + importConfig.markupAmount / 100);
    } else {
      customerPrice = internalCost + importConfig.markupAmount;
    }

    const rounding = currencySettings.price_rounding || "2_decimals";

    if (rounding === "whole") {
      customerPrice = Math.round(customerPrice);
    } else if (rounding === "nearest_5") {
      customerPrice = Math.round(customerPrice / 5) * 5;
    } else if (rounding === "nearest_10") {
      customerPrice = Math.round(customerPrice / 10) * 10;
    } else {
      customerPrice = Math.round(customerPrice * 100) / 100;
    }

    const currencySymbol =
      currencySettings.customer_currency === "PKR"
        ? "Rs."
        : currencySettings.customer_currency === "USDT"
          ? "₮"
          : "$";

    return {
      usdt: usdtCost.toFixed(4),
      cost: internalCost.toFixed(2),
      price: customerPrice.toFixed(2),
      symbol: currencySymbol,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search by ID, name or category..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 shadow-sm"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleFetchServices}
            disabled={isFetching || importLoading}
            className="bg-white text-gray-900 border border-gray-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw
              className={isFetching ? "animate-spin" : ""}
              size={16}
            />
            Fetch Services
          </button>

          <button
            onClick={handleSyncLimits}
            disabled={syncingLimits || importLoading}
            title="Refresh min/max order quantity for already imported services without changing their status or category"
            className="bg-white text-purple-700 border border-purple-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-purple-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw
              className={syncingLimits ? "animate-spin" : ""}
              size={16}
            />
            Sync Min/Max
          </button>

          <button
            onClick={handleAutoImport}
            disabled={
              importLoading ||
              isFetching ||
              services.length === 0
            }
            title="Import all provider services and automatically map them to matching platform subcategories"
            className="bg-emerald-600 text-white border border-emerald-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            {importLoading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Database size={16} />
            )}
            Import All & Auto Categorize
          </button>

          {selectedServices.length > 0 && (
            <button
              onClick={() => setShowImportModal(true)}
              disabled={importLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all transform active:scale-95"
            >
              <Plus size={16} />
              Import ({selectedServices.length})
            </button>
          )}
        </div>
      </div>

      {/* Provider Services Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={
                      selectedServices.length === filteredServices.length &&
                      filteredServices.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>

                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Provider ID
                </th>

                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Service Name
                </th>

                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Category
                </th>

                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Provider Rate
                </th>

                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Min/Max
                </th>

                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <RefreshCw
                      className="animate-spin text-blue-600 mx-auto"
                      size={24}
                    />
                    <p className="mt-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                      Loading services...
                    </p>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Database
                      className="text-gray-200 mx-auto mb-2"
                      size={32}
                    />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                      No services found
                    </p>
                    <button
                      onClick={handleFetchServices}
                      className="mt-4 text-blue-600 text-xs font-black uppercase"
                    >
                      Click to Fetch
                    </button>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => {
                  const serviceId = String(service.provider_service_id);

                  return (
                    <tr
                      key={serviceId}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedServices.includes(serviceId)}
                          onChange={() => handleToggleSelect(serviceId)}
                        />
                      </td>

                      <td className="px-6 py-4 text-xs font-black text-gray-400">
                        {service.provider_service_id}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-gray-900 text-sm uppercase tracking-tight">
                          {service.name}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
                          {service.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-black text-green-600">
                        Rs.
                        {(
                          Number(service.provider_cost || 0) *
                          (service.provider_currency === "PKR" ? 1 : 280)
                        ).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-[10px] font-bold text-gray-400">
                        {service.provider_min} / {service.provider_max}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-green-500">
                          <CheckCircle2 size={12} />
                          {service.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                  Import <span className="text-blue-600">Services</span>
                </h3>

                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {selectedServices.length} items selected
                </p>
              </div>

              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Target Subcategory
                </label>

                <p className="text-[9px] font-bold text-gray-400 uppercase">
                  Customers see: Platform → Subcategory → these services
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <select
                    value={importConfig.categoryId}
                    onChange={(event) =>
                      setImportConfig((prev) => ({
                        ...prev,
                        categoryId: event.target.value,
                        createNewCategory: "",
                      }))
                    }
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select an existing category</option>

                    {categories
                      .filter((category: any) => category.parent_category_id)
                      .sort((a: any, b: any) => {
                        const parentA =
                          categories.find(
                            (parent: any) =>
                              parent.id === a.parent_category_id
                          )?.name ?? "";

                        const parentB =
                          categories.find(
                            (parent: any) =>
                              parent.id === b.parent_category_id
                          )?.name ?? "";

                        return (
                          parentA.localeCompare(parentB) ||
                          a.name.localeCompare(b.name)
                        );
                      })
                      .map((category: any) => {
                        const parent = categories.find(
                          (item: any) =>
                            item.id === category.parent_category_id
                        );

                        return (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {parent?.name ?? "Unknown"} → {category.name}
                          </option>
                        );
                      })}
                  </select>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-100" />
                    </div>

                    <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
                      <span className="bg-white px-2 text-gray-300">
                        OR CREATE NEW SUBCATEGORY
                      </span>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="New subcategory name (e.g. Likes, Views)..."
                    value={importConfig.createNewCategory}
                    onChange={(event) =>
                      setImportConfig((prev) => ({
                        ...prev,
                        createNewCategory: event.target.value,
                        categoryId: "",
                      }))
                    }
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100"
                  />

                  {importConfig.createNewCategory && (
                    <select
                      value={importConfig.parentCategoryId}
                      onChange={(event) =>
                        setImportConfig((prev) => ({
                          ...prev,
                          parentCategoryId: event.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        — No parent (this becomes a Platform) —
                      </option>

                      {categories
                        .filter(
                          (category: any) =>
                            !category.parent_category_id
                        )
                        .map((platform: any) => (
                          <option key={platform.id} value={platform.id}>
                            Put under Platform: {platform.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Markup Config */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Profit / Markup
                </label>

                <div className="flex gap-2">
                  <div className="flex-1 flex bg-gray-50 rounded-2xl p-1">
                    <button
                      onClick={() =>
                        setImportConfig((prev) => ({
                          ...prev,
                          markupType: "percentage",
                        }))
                      }
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        importConfig.markupType === "percentage"
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      Percentage
                    </button>

                    <button
                      onClick={() =>
                        setImportConfig((prev) => ({
                          ...prev,
                          markupType: "fixed",
                        }))
                      }
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        importConfig.markupType === "fixed"
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      Fixed
                    </button>
                  </div>

                  <div className="w-32 relative">
                    <input
                      type="number"
                      value={importConfig.markupAmount}
                      onChange={(event) =>
                        setImportConfig((prev) => ({
                          ...prev,
                          markupAmount: Number(event.target.value),
                        }))
                      }
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-black text-gray-900 focus:ring-2 focus:ring-blue-100 pr-10"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">
                      {importConfig.markupType === "percentage"
                        ? "%"
                        : currencySettings?.customer_currency || "USDT"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Preview */}
              <div className="bg-blue-50/50 rounded-3xl p-6 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <span>Price Calculation Example</span>
                  <span>
                    1 USDT = {currencySettings?.usdt_rate}{" "}
                    {currencySettings?.customer_currency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Provider Rate
                    </div>

                    <div className="text-lg font-black text-gray-900 tracking-tight">
                      0.0370{" "}
                      <span className="text-xs text-gray-400 font-bold">
                        (USDT)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Internal Cost
                    </div>

                    <div className="text-lg font-black text-gray-900 tracking-tight">
                      {calculatePreview(0).symbol}
                      {(
                        0.037 *
                        parseFloat(currencySettings?.usdt_rate || "280")
                      ).toFixed(2)}{" "}
                      <span className="text-xs text-gray-400 font-bold">
                        ({currencySettings?.customer_currency})
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-100/50">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Profit (
                      {importConfig.markupAmount}
                      {importConfig.markupType === "percentage"
                        ? "%"
                        : " " + currencySettings?.customer_currency}
                      )
                    </div>

                    <div className="text-lg font-black text-green-600 tracking-tight">
                      +{calculatePreview(0).symbol}
                      {importConfig.markupType === "percentage"
                        ? (
                            (parseFloat(
                              currencySettings?.usdt_rate || "280"
                            ) *
                              0.037 *
                              importConfig.markupAmount) /
                            100
                          ).toFixed(2)
                        : importConfig.markupAmount.toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-100/50">
                    <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">
                      Final Price
                    </div>

                    <div className="text-lg font-black text-blue-600 tracking-tight">
                      {calculatePreview(0).symbol}
                      {calculatePreview(0.037).price}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-gray-50/50 flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-white transition-all shadow-sm"
              >
                Cancel
              </button>

              <button
                onClick={executeImport}
                disabled={
                  importLoading ||
                  (!importConfig.categoryId &&
                    !importConfig.createNewCategory)
                }
                className="flex-[2] bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {importLoading ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
                Confirm & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
