
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

      const parsed = typeof result === "string" ? JSON.parse(result) : result;

      if (parsed.success) {
        toast.success(
          `Imported: ${parsed.importedCount} | Updated: ${parsed.updatedCount} | Unmatched: ${parsed.unmatchedCount}`
        );
        setSelectedServices([]);
      } else {
        toast.error(parsed.message || "Auto import failed.");
      }
    } catch (error: any) {
      toast.error("Auto import error: " + error.message);
    } finally {
      setImportLoading(false);
    }
  };
