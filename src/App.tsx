import React, { useState, useEffect } from 'react';
import {
  DepartmentId,
  QuotationItem,
  ClientInfo,
  SavedQuotation,
  UserSession,
  ContractData,
} from './types';
import { Header } from './components/Header';
import { DepartmentNav } from './components/DepartmentNav';
import { DesignCalculator } from './components/departments/DesignCalculator';
import { SupervisionCalculator } from './components/departments/SupervisionCalculator';
import { DecorCalculator } from './components/departments/DecorCalculator';
import { SurveyCalculator } from './components/departments/SurveyCalculator';
import { CivilDefenseCalculator } from './components/departments/CivilDefenseCalculator';
import { ExecutionCalculator } from './components/departments/ExecutionCalculator';
import { QuotationDrawer } from './components/quotation/QuotationDrawer';
import { QuotationPrintView } from './components/quotation/QuotationPrintView';
import { PricingGuideModal } from './components/modals/PricingGuideModal';
import { SavedQuotationsModal } from './components/modals/SavedQuotationsModal';
import { MasterTemplateInfoModal } from './components/modals/MasterTemplateInfoModal';
import { ExportAndInstallModal } from './components/ExportAndInstallModal';
import { GeminiDeedAssistantModal } from './components/ai/GeminiDeedAssistantModal';
import { PrivatePortalLogin } from './components/auth/PrivatePortalLogin';
import { AdminSecurityModal } from './components/modals/AdminSecurityModal';
import { ContractEditorModal } from './components/contract/ContractEditorModal';
import { buildSmartContract } from './data/smartContractEngine';
import {
  getSavedSession,
  clearSession,
  initPasscodeListener,
  isUserPrimaryAdmin,
} from './lib/security';
import {
  generateQuoteNumber,
  incrementQuoteNumber,
  getTodayDateString,
  formatSAR,
  extractQuoteSequence,
  getStoredQuoteSequence,
  setStoredQuoteSequence,
  resetStoredQuoteSequence,
  MAX_QUOTE_SEQUENCE,
  MIN_QUOTE_SEQUENCE,
} from './utils/formatters';
import {
  getDefaultClientInfo,
  autoDetectScopeFlags,
  autoDetectExclusions,
} from './data/masterTemplateDefaults';
import {
  saveQuotationToCloud,
  deleteQuotationFromCloud,
  subscribeToQuotations,
} from './lib/firebase';
import {
  loadInitialArchive,
  persistQuotationPermanently,
  deleteQuotationPermanently,
  deleteMultipleQuotationsPermanently,
  deduplicateQuotations,
  readFromLocalStorage,
  writeToLocalStorage,
  PRIMARY_STORAGE_KEY,
} from './lib/archiveStorage';
import { CheckCircle, AlertCircle, ShoppingBag, Sparkles, FileText, ArrowLeft, PlusCircle } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'alroaya_quote_items_v1';
const STORAGE_KEY_CLIENT = 'alroaya_client_info_v1';
const STORAGE_KEY_SAVED = 'alroaya_saved_quotes_v1';
const STORAGE_KEY_OUTPUT_MODE = 'alroaya_output_mode_v1';

export default function App() {
  const [activeDept, setActiveDept] = useState<DepartmentId>('design');
  const [outputMode, setOutputMode] = useState<'master' | 'simplified'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OUTPUT_MODE);
      return saved === 'simplified' ? 'simplified' : 'master';
    } catch {
      return 'master';
    }
  });
  const [cartItems, setCartItems] = useState<QuotationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [clientInfo, setClientInfo] = useState<ClientInfo>(() => {
    const defaultInfo = getDefaultClientInfo();
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        const resolvedLandArea = parsed.landArea ?? defaultInfo.landArea;
        const resolvedBuildingArea =
          parsed.buildingArea !== undefined && parsed.buildingArea !== null
            ? parsed.buildingArea
            : Math.round(resolvedLandArea * 1.68);
        const resolvedBuildingType = parsed.buildingType || defaultInfo.buildingType;
        let resolvedProjectTitle = parsed.projectTitle || defaultInfo.projectTitle;
        if (
          resolvedBuildingType &&
          (!resolvedProjectTitle ||
            (resolvedProjectTitle === 'مشروع فيلا سكنية خاصة' && !resolvedBuildingType.includes('فيلا')))
        ) {
          resolvedProjectTitle = `مشروع ${resolvedBuildingType}`;
        }
        const cleanedDistrict =
          parsed.district === 'حي حطين' || parsed.district === 'حي النرجس'
            ? ''
            : parsed.district || '';
        const cleanedPlotNumber = parsed.plotNumber === '104' ? '' : parsed.plotNumber || '';
        const cleanedPlanNumber =
          parsed.planNumber === '2456 / أ' || parsed.planNumber === '3240 / أ'
            ? ''
            : parsed.planNumber || '';

        // Requirement 6: Reloading the page recovers the exact saved draft proposal number
        const resolvedProposalNumber =
          parsed.proposalNumber !== undefined &&
          parsed.proposalNumber !== null &&
          String(parsed.proposalNumber).trim() !== ''
            ? String(parsed.proposalNumber).trim()
            : generateQuoteNumber(false);

        // Keep stored sequence in sync with the active draft proposal number
        const draftSeq = extractQuoteSequence(resolvedProposalNumber);
        if (draftSeq !== null && draftSeq >= MIN_QUOTE_SEQUENCE && draftSeq <= MAX_QUOTE_SEQUENCE) {
          setStoredQuoteSequence(draftSeq);
        }

        return {
          ...defaultInfo,
          ...parsed,
          district: cleanedDistrict,
          locationZone: cleanedDistrict ? (parsed.locationZone || 'none') : 'none',
          plotNumber: cleanedPlotNumber,
          planNumber: cleanedPlanNumber,
          proposalNumber: resolvedProposalNumber,
          buildingType: resolvedBuildingType,
          projectTitle: resolvedProjectTitle,
          landArea: resolvedLandArea,
          buildingArea: resolvedBuildingArea,
          startDateNotice:
            !parsed.startDateNotice ||
            parsed.startDateNotice.includes('اعتماد الفكرة المعمارية')
              ? 'من سداد الدفعة واعتماد المخططات المعمارية والواجهات'
              : parsed.startDateNotice,
          includeTax: parsed.includeTax === true && parsed._userToggledTax ? true : false,
          discountType: parsed.discountType || defaultInfo.discountType || 'percentage',
          discountValue:
            parsed.discountValue !== undefined && parsed._userToggledDiscount
              ? parsed.discountValue
              : 20,
          scopeFlags: {
            ...defaultInfo.scopeFlags,
            ...(parsed.scopeFlags || {}),
          },
          exclusions: {
            ...defaultInfo.exclusions,
            ...(parsed.exclusions || {}),
          },
          customMilestones: Array.isArray(parsed.customMilestones)
            ? parsed.customMilestones.map((m: any) =>
                m.description === 'عند اعتماد المخططات المعمارية والبدء بإعداد المخططات الإنشائية والكهروميكانيكية والتنفيذية.'
                  ? { ...m, description: 'بعد الانتهاء من المخططات الإنشائية والكهروميكانيكية والتنفيذية.' }
                  : m
              )
            : undefined,
          bankDetails:
            parsed.bankDetails?.bankName?.includes('الراجحي') ||
            parsed.bankDetails?.iban?.includes('0458') ||
            !parsed.bankDetails?.iban
              ? { ...defaultInfo.bankDetails }
              : {
                  ...defaultInfo.bankDetails,
                  ...(parsed.bankDetails || {}),
                },
        };
      }
    } catch {
      // ignore
    }
    return defaultInfo;
  });

  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>(() => {
    return readFromLocalStorage();
  });
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // UI Modals / Views
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [printClientInfo, setPrintClientInfo] = useState<ClientInfo | null>(null);
  const [printItems, setPrintItems] = useState<QuotationItem[] | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isMasterTemplateOpen, setIsMasterTemplateOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isContractEditorOpen, setIsContractEditorOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadedQuoteId, setLoadedQuoteId] = useState<string | null>(null);

  // User Authentication & Private Portal Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getSavedSession());
  const [isSecurityOpen, setIsSecurityOpen] = useState<boolean>(false);

  // Sync engineer name with clientInfo.preparedBy
  useEffect(() => {
    if (currentUser?.engineerName && !clientInfo.preparedBy) {
      setClientInfo((prev) => ({
        ...prev,
        preparedBy: currentUser.engineerName,
      }));
    }
  }, [currentUser]);

  // Real-time listener for office passcode changes across devices
  useEffect(() => {
    const unsub = initPasscodeListener();
    return () => unsub && unsub();
  }, []);

  // Load resilient persistent archive across Server Disk + IndexedDB + LocalStorage on boot
  useEffect(() => {
    loadInitialArchive().then((quotes) => {
      if (quotes && quotes.length > 0) {
        setSavedQuotations((prev) => deduplicateQuotations([...quotes, ...prev]));
      }
    });
  }, []);

  // Subscribe to real-time central company archive in Firebase:
  // Requirement 3: Archive updates must only update the archive list and NEVER mutate the active draft or sequence counter!
  useEffect(() => {
    const unsubscribe = subscribeToQuotations(
      (cloudQuotes) => {
        setIsCloudConnected(true);
        if (cloudQuotes && cloudQuotes.length > 0) {
          setSavedQuotations((prev) => {
            const merged = deduplicateQuotations([...cloudQuotes, ...prev]);
            writeToLocalStorage(merged);
            return merged;
          });
        }
      },
      () => {
        setIsCloudConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync with local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(clientInfo));
    } catch {
      // ignore
    }
  }, [clientInfo]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedQuotations));
    } catch {
      // ignore
    }
  }, [savedQuotations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OUTPUT_MODE, outputMode);
    } catch {
      // ignore
    }
  }, [outputMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleSimplifiedMode = () => {
    setOutputMode((prev) => {
      const next = prev === 'simplified' ? 'master' : 'simplified';
      if (next === 'simplified') {
        showToast('تم تفعيل «برنامج الاصالة المبسط» — ستصدر مخرجات عروض الأسعار بالتصميم البصري المبسط');
      } else {
        showToast('تم التحويل إلى «النموذج الموحد الرسمي»');
      }
      return next;
    });
  };

  const isResettingRef = React.useRef<boolean>(false);
  const isSavingRef = React.useRef<boolean>(false);

  const sanitizeContractData = (contract: ContractData): ContractData => ({
    ...contract,
    scopeGroups: contract.scopeGroups.map((g) => ({
      ...g,
      subtitle: g.subtitle || '',
    })),
  });

  const handleSaveContractData = (contractData: ContractData) => {
    const sanitized = sanitizeContractData(contractData);
    setClientInfo((prev) => ({
      ...prev,
      contractData: sanitized,
    }));
    showToast(
      sanitized.enabled
        ? `تم حفظ وتفعيل العقد الذكي (${sanitized.contractTitle}) وإرفاقه مع عرض السعر`
        : 'تم حفظ تعديلات العقد (غير مرفق حالياً مع عرض السعر)'
    );
  };

  const handleSaveContractAndPreview = async (contractData: ContractData) => {
    const sanitized = sanitizeContractData({ ...contractData, enabled: true });
    const updatedClient: ClientInfo = {
      ...clientInfo,
      contractData: sanitized,
    };
    setClientInfo(updatedClient);
    setIsContractEditorOpen(false);
    setIsCartOpen(false);
    setPrintClientInfo(updatedClient);
    setPrintItems([...cartItems]);
    setIsPrintMode(true);
  };

  const handleAddItem = (item: QuotationItem) => {
    setCartItems((prev) => {
      const nextItems = [...prev, item];
      // Automatically detect and merge new scope units
      const detected = autoDetectScopeFlags(nextItems);
      setClientInfo((prevInfo) => {
        const autoBuildingType = item.buildingTypeLabel || prevInfo.buildingType;
        const autoProjectTitle = item.buildingTypeLabel
          ? `مشروع ${item.buildingTypeLabel}`
          : prevInfo.projectTitle;
        const isOnlyDecor = nextItems.every((i) => i.departmentId === 'decor');
        const autoServiceType = isOnlyDecor
          ? 'التصميم الداخلي والديكور'
          : prevInfo.serviceType === 'التصميم الداخلي والديكور'
          ? 'إصدار رخصة بناء وتصاميم هندسية'
          : prevInfo.serviceType;
        const nextInfo: ClientInfo = {
          ...prevInfo,
          buildingType: autoBuildingType,
          serviceType: autoServiceType,
          isDuplex: item.isDuplex !== undefined ? item.isDuplex : prevInfo.isDuplex,
          projectTitle: autoProjectTitle,
          scopeFlags: {
            ...detected,
          },
          // If supervision is present, remove excludeSupervision
          exclusions: {
            ...prevInfo.exclusions,
            excludeSupervision: !detected.supervision,
            excludeCivilDefense: !detected.civilDefense,
          },
        };
        if (prevInfo.contractData && prevInfo.contractData.autoSynced !== false) {
          nextInfo.contractData = sanitizeContractData(
            buildSmartContract(nextInfo, nextItems, undefined, prevInfo.contractData.enabled)
          );
        }
        return nextInfo;
      });
      return nextItems;
    });
    showToast(`تمت إضافة "${item.title}" وتحديث نطاق النموذج الموحد`);
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id);
      setClientInfo((prevInfo) => {
        if (prevInfo.contractData && prevInfo.contractData.autoSynced !== false) {
          return {
            ...prevInfo,
            contractData: sanitizeContractData(
              buildSmartContract(prevInfo, nextItems, undefined, prevInfo.contractData.enabled)
            ),
          };
        }
        return prevInfo;
      });
      return nextItems;
    });
  };

  const handleUpdateItem = (updatedItem: QuotationItem) => {
    setCartItems((prev) => {
      const nextItems = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      setClientInfo((prevInfo) => {
        if (prevInfo.contractData && prevInfo.contractData.autoSynced !== false) {
          return {
            ...prevInfo,
            contractData: sanitizeContractData(
              buildSmartContract(prevInfo, nextItems, undefined, prevInfo.contractData.enabled)
            ),
          };
        }
        return prevInfo;
      });
      return nextItems;
    });
    showToast(`تم تحديث بند "${updatedItem.title}" بنجاح ✏️`);
  };

  const handleInstantResetNewQuotation = async () => {
    // Prevent double-clicks / repeated rapid calls
    if (isResettingRef.current) return;
    isResettingRef.current = true;

    try {
      const currentSeq = extractQuoteSequence(clientInfo.proposalNumber) ?? getStoredQuoteSequence();

      // Requirement 8: Stop at 100,000 with a clear message, without rolling back or wiping
      if (currentSeq >= MAX_QUOTE_SEQUENCE) {
        showToast('تم الوصول إلى الحد الأقصى لأرقام عروض الأسعار (100,000). لا يمكن إنشاء رقم عرض أعلى.');
        return;
      }

      // If there were items, silently secure into permanent archive with its CURRENT number
      if (cartItems.length > 0) {
        try {
          await handleSaveQuotation({ silent: true });
        } catch (err) {
          console.error('Error saving before reset:', err);
        }
      }

      // Increment sequential proposal number strictly by +1 exactly once
      const nextSeq = currentSeq + 1;
      setStoredQuoteSequence(nextSeq);
      const nextProposalNumber = String(nextSeq);

      // Immediately wipe items and clear loaded quote id
      setCartItems([]);
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      setLoadedQuoteId(null);

      // Reset client info to clean default template
      const defaultInfo = getDefaultClientInfo();
      const freshClientInfo: ClientInfo = {
        ...defaultInfo,
        proposalNumber: nextProposalNumber,
        preparedBy: currentUser?.engineerName || defaultInfo.preparedBy || 'م. ماجد (المدير العام)',
        date: getTodayDateString(),
      };

      setClientInfo(freshClientInfo);
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(freshClientInfo));

      // Close any open views
      setIsCartOpen(false);
      setPrintClientInfo(null);
      setPrintItems(null);

      showToast(`تم تفريغ العرض وتجهيز عرض جديد رقم (${nextProposalNumber}) بنجاح ✨`);
    } catch (err) {
      console.error('Error during instant new quote reset:', err);
      showToast('حدث خطأ أثناء إعداد العرض الجديد');
    } finally {
      setTimeout(() => {
        isResettingRef.current = false;
      }, 500);
    }
  };

  const handleClearItems = () => {
    handleInstantResetNewQuotation();
  };

  const handleUpdateClientInfo = (updated: Partial<ClientInfo>) => {
    if (updated.proposalNumber !== undefined) {
      const seq = extractQuoteSequence(updated.proposalNumber);
      if (seq !== null && seq >= 0 && seq <= 100000) {
        setStoredQuoteSequence(seq);
      }
    }
    setClientInfo((prev) => {
      let autoBuildingArea = updated.buildingArea;
      if (updated.landArea !== undefined && updated.buildingArea === undefined) {
        autoBuildingArea = Math.round(updated.landArea * 1.68);
      }
      let autoProjectTitle = updated.projectTitle;
      if (updated.buildingType && !updated.projectTitle) {
        autoProjectTitle = `مشروع ${updated.buildingType}`;
      }
      return {
        ...prev,
        ...updated,
        ...(autoBuildingArea !== undefined ? { buildingArea: autoBuildingArea } : {}),
        ...(autoProjectTitle !== undefined ? { projectTitle: autoProjectTitle } : {}),
      };
    });
  };

  const handleApplyAiExtractedData = (
    updated: Partial<ClientInfo>,
    suggestedScopeFlags?: any,
    shouldAddDefaultService?: boolean
  ) => {
    handleUpdateClientInfo(updated);

    if (suggestedScopeFlags) {
      setClientInfo((prev) => ({
        ...prev,
        scopeFlags: {
          ...prev.scopeFlags,
          ...(suggestedScopeFlags.architectural !== undefined && { architectural: suggestedScopeFlags.architectural }),
          ...(suggestedScopeFlags.structural !== undefined && { structural: suggestedScopeFlags.structural }),
          ...(suggestedScopeFlags.electrical !== undefined && { electrical: suggestedScopeFlags.electrical }),
          ...(suggestedScopeFlags.plumbing !== undefined && { plumbing: suggestedScopeFlags.plumbing }),
          ...(suggestedScopeFlags.hvac !== undefined && { hvac: suggestedScopeFlags.hvac }),
          ...(suggestedScopeFlags.survey !== undefined && { survey: suggestedScopeFlags.survey }),
          ...(suggestedScopeFlags.civilDefense !== undefined && { civilDefense: suggestedScopeFlags.civilDefense }),
          ...(suggestedScopeFlags.buildingLicense !== undefined && { buildingLicense: suggestedScopeFlags.buildingLicense }),
          ...(suggestedScopeFlags.supervision !== undefined && { supervision: suggestedScopeFlags.supervision }),
        },
        exclusions: {
          ...prev.exclusions,
          ...(suggestedScopeFlags.supervision !== undefined && { excludeSupervision: !suggestedScopeFlags.supervision }),
          ...(suggestedScopeFlags.civilDefense !== undefined && { excludeCivilDefense: !suggestedScopeFlags.civilDefense }),
        },
      }));
    }

    if (shouldAddDefaultService) {
      const bTypeLabel = updated.buildingType || clientInfo.buildingType || 'فيلا سكنية';
      const land = updated.landArea || clientInfo.landArea || 500;
      const bArea = updated.buildingArea || clientInfo.buildingArea || Math.round(land * 1.68);
      const isCommercial =
        bTypeLabel.includes('تجاري') ||
        bTypeLabel.includes('عمارة') ||
        bTypeLabel.includes('فندق') ||
        bTypeLabel.includes('مصنع');
      const rate = isCommercial ? 35 : 25;
      const calculatedPrice = Math.max(12000, Math.round(bArea * rate));

      const newItem: QuotationItem = {
        id: `ai-item-${Date.now()}`,
        departmentId: 'design',
        departmentName: 'قسم التصميم المعماري والإنشائي',
        title: `حزمة التصميم الهندسي المتكامل وإصدار رخصة البناء (${bTypeLabel})`,
        buildingTypeLabel: bTypeLabel,
        area: bArea,
        basePrice: calculatedPrice,
        totalPrice: calculatedPrice,
        details: [
          'إصدار رخصة البناء المعتمدة من منصة بلدي والكود السعودي',
          'المخططات المعمارية والإنشائية التنفيذية المتكاملة',
          'مخططات الكهرباء والسباكة وتوزيع الأحمال والتكييف',
          'اعتماد الرفع المساحي والربط مع المستكشف الجغرافي',
        ],
        notes: `مستخرج تلقائياً عبر الذكاء الاصطناعي لمشروع: ${updated.projectTitle || `مشروع ${bTypeLabel}`}`,
      };

      setCartItems((prev) => [newItem, ...prev.filter((i) => !i.id.startsWith('ai-item-'))]);
      showToast('تم تطبيق بيانات الصك وإضافة حزمة التصميم والرخصة للسلة بنجاح ✨');
    } else {
      showToast('تم تطبيق وتوزيع كافة بيانات الصك في البرنامج بنجاح ✨');
    }
  };

  const handleSaveQuotation = async (options?: { silent?: boolean }): Promise<SavedQuotation | null> => {
    if (cartItems.length === 0) return null;
    if (isSavingRef.current) return null;
    isSavingRef.current = true;

    try {
      const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
      let discount = 0;
      if (clientInfo.discountType === 'percentage') {
        discount = Math.round((subtotal * (clientInfo.discountValue || 0)) / 100);
      } else {
        discount = clientInfo.discountValue || 0;
      }
      discount = Math.min(discount, subtotal);

      const amountAfterDiscount = subtotal - discount;
      const tax = clientInfo.includeTax ? Math.round(amountAfterDiscount * 0.15) : 0;
      const grandTotal = amountAfterDiscount + tax;

      // Keep ID stable for repeated saves of the active draft session
      const quoteId = loadedQuoteId || `quote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      if (!loadedQuoteId) {
        setLoadedQuoteId(quoteId);
      }

      const proposalNumberToSave = clientInfo.proposalNumber || generateQuoteNumber(false);

      const newSaved: SavedQuotation = {
        id: quoteId,
        quoteNumber: proposalNumberToSave,
        createdAt: new Date().toLocaleDateString('ar-SA'),
        clientInfo: {
          ...clientInfo,
          proposalNumber: proposalNumberToSave,
          preparedBy: currentUser?.engineerName || clientInfo.preparedBy,
        },
        items: [...cartItems],
        subtotal,
        discount,
        tax,
        grandTotal,
        preparedBy: currentUser?.engineerName || clientInfo.preparedBy,
        isSequential: true,
      };

      // Permanently persist across all layers: Server Disk + IndexedDB + LocalStorage (primary & backup) + Cloud
      const updatedList = await persistQuotationPermanently(newSaved, savedQuotations);
      setSavedQuotations(updatedList);

      if (!options?.silent) {
        showToast(`تم حفظ وتأمين عرض السعر رقم (${proposalNumberToSave}) في الأرشيف الدائم بنجاح 💾`);
      }

      return newSaved;
    } catch (err) {
      console.error('Error in handleSaveQuotation:', err);
      return null;
    } finally {
      isSavingRef.current = false;
    }
  };

  const handlePrintAndPreview = async () => {
    if (cartItems.length === 0) return;

    // Automatically ensure the quotation is safely saved to the permanent archive before opening print mode!
    await handleSaveQuotation({ silent: true });

    // Open print preview with current proposalNumber unchanged
    setPrintClientInfo({ ...clientInfo });
    setPrintItems([...cartItems]);
    setIsCartOpen(false);
    setIsPrintMode(true);
  };

  const handleBackFromPrint = () => {
    setIsPrintMode(false);
    setPrintClientInfo(null);
    setPrintItems(null);
  };

  const handleLoadQuotation = (saved: SavedQuotation) => {
    setLoadedQuoteId(saved.id);
    setClientInfo({ ...saved.clientInfo });
    setCartItems([...saved.items]);
    setIsHistoryOpen(false);
    setIsCartOpen(true);
    showToast(`تم استرجاع عرض السعر (${saved.quoteNumber}) بنجاح`);
  };

  const handleResetDraftSequence = () => {
    resetStoredQuoteSequence();
    setClientInfo((prev) => {
      const updated = {
        ...prev,
        proposalNumber: '0',
      };
      try {
        localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setLoadedQuoteId(null);
    showToast('تمت إعادة ضبط عداد مسودة عروض الأسعار إلى (0) بنجاح');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setIsSecurityOpen(false);
    showToast('تم تسجيل الخروج وقفل الأداة بنجاح');
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!currentUser || !isUserPrimaryAdmin(currentUser.engineerName)) {
      showToast('عذراً! صلاحية حذف عروض الأسعار مخصصة حصرياً للإدارة (م.ماجد / م.نور / م.اصالة)');
      return;
    }
    const updated = await deleteQuotationPermanently(id, savedQuotations, currentUser.engineerName);
    setSavedQuotations(updated);
    showToast('تم حذف العرض من الأرشيف نهائياً 🗑️');
  };

  const handleDeleteMultipleQuotations = async (ids: string[]) => {
    if (!currentUser || !isUserPrimaryAdmin(currentUser.engineerName)) {
      showToast('عذراً! صلاحية حذف عروض الأسعار مخصصة حصرياً للإدارة (م.ماجد / م.نور / م.اصالة)');
      return;
    }
    if (!ids || ids.length === 0) return;
    const count = ids.length;
    const updated = await deleteMultipleQuotationsPermanently(ids, savedQuotations, currentUser.engineerName);
    setSavedQuotations(updated);
    showToast(`تم حذف ${count} ${count === 1 ? 'عرض سعر' : 'عروض أسعار'} من الأرشيف نهائياً 🗑️`);
  };

  // Department item count badges
  const departmentCounts: Record<DepartmentId, number> = {
    design: cartItems.filter((i) => i.departmentId === 'design').length,
    supervision: cartItems.filter((i) => i.departmentId === 'supervision').length,
    decor: cartItems.filter((i) => i.departmentId === 'decor').length,
    survey: cartItems.filter((i) => i.departmentId === 'survey').length,
    civil_defense: cartItems.filter((i) => i.departmentId === 'civil_defense').length,
    execution: cartItems.filter((i) => i.departmentId === 'execution').length,
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Private Portal Security Gate: If not authenticated, require office login
  if (!currentUser) {
    return (
      <PrivatePortalLogin
        onLoginSuccess={(session) => {
          setCurrentUser(session);
          setClientInfo((prev) => ({
            ...prev,
            preparedBy: session.engineerName,
          }));
          showToast(`أهلاً بك ${session.engineerName} • تم فتح المنصة بنجاح`);
        }}
      />
    );
  }

  if (isPrintMode) {
    return (
      <QuotationPrintView
        items={printItems || cartItems}
        clientInfo={printClientInfo || clientInfo}
        onBack={handleBackFromPrint}
        initialViewMode={outputMode}
        onViewModeChange={(mode) => {
          if (mode === 'simplified' || mode === 'master') {
            setOutputMode(mode);
          }
        }}
        onUpdateClientInfo={(updated) => {
          handleUpdateClientInfo(updated);
          setPrintClientInfo((prev) => (prev ? { ...prev, ...updated } : prev));
        }}
        onPrintComplete={() => {
          handleSaveQuotation({ silent: true });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        cartItemCount={cartItems.length}
        cartTotal={cartTotal}
        savedCount={savedQuotations.length}
        isCloudConnected={isCloudConnected}
        session={currentUser}
        onOpenSecurity={() => {
          if (isUserPrimaryAdmin(currentUser?.engineerName)) {
            setIsSecurityOpen(true);
          }
        }}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPricingGuide={() => setIsGuideOpen(true)}
        onOpenMasterTemplate={() => setIsMasterTemplateOpen(true)}
        onPrintDirect={handlePrintAndPreview}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onNewQuotation={handleInstantResetNewQuotation}
        isSimplifiedMode={outputMode === 'simplified'}
        onToggleSimplifiedMode={handleToggleSimplifiedMode}
        isContractAttached={Boolean(clientInfo.contractData?.enabled)}
        onOpenContractEditor={() => setIsContractEditorOpen(true)}
      />

      {/* Department Navigation Tabs */}
      <DepartmentNav
        activeDept={activeDept}
        onSelectDept={setActiveDept}
        departmentCounts={departmentCounts}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeDept === 'design' && (
          <DesignCalculator
            onAddItem={handleAddItem}
            clientInfo={clientInfo}
            onUpdateClientInfo={handleUpdateClientInfo}
            onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          />
        )}
        {activeDept === 'supervision' && (
          <SupervisionCalculator
            onAddItem={handleAddItem}
            clientInfo={clientInfo}
            onUpdateClientInfo={handleUpdateClientInfo}
          />
        )}
        {activeDept === 'decor' && (
          <DecorCalculator
            onAddItem={handleAddItem}
            clientInfo={clientInfo}
            onUpdateClientInfo={handleUpdateClientInfo}
          />
        )}
        {activeDept === 'survey' && (
          <SurveyCalculator
            onAddItem={handleAddItem}
            clientInfo={clientInfo}
            onUpdateClientInfo={handleUpdateClientInfo}
          />
        )}
        {activeDept === 'civil_defense' && (
          <CivilDefenseCalculator
            onAddItem={handleAddItem}
            clientInfo={clientInfo}
            onUpdateClientInfo={handleUpdateClientInfo}
          />
        )}
        {activeDept === 'execution' && (
          <ExecutionCalculator
            onAddItem={handleAddItem}
            clientInfo={clientInfo}
            onUpdateClientInfo={handleUpdateClientInfo}
          />
        )}
      </main>

      {/* Persistent Bottom Bar on Mobile/Tablet if Cart has items */}
      {cartItems.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-stone-900 text-white p-3 border-t border-stone-800 flex items-center justify-between z-20 shadow-lg no-print">
          <div>
            <div className="text-[10px] text-stone-400">إجمالي عرض السعر ({cartItems.length} بنود)</div>
            <div className="text-sm font-black text-amber-400">{formatSAR(cartTotal)}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInstantResetNewQuotation}
              className="bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer active:scale-90"
              title="تفريغ وبدء عرض جديد فارغ فوراً"
            >
              <PlusCircle className="w-3 h-3 text-amber-400" />
              <span>جديد</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="bg-amber-500 text-stone-950 px-3 py-1.5 rounded-xl text-xs font-black shadow flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>معاينة العرض</span>
            </button>
          </div>
        </div>
      )}

      {/* Quotation Drawer */}
      <QuotationDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateItem={handleUpdateItem}
        onClearItems={handleClearItems}
        clientInfo={clientInfo}
        onUpdateClientInfo={handleUpdateClientInfo}
        onPrint={handlePrintAndPreview}
        onSaveQuote={() => handleSaveQuotation()}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onNewQuotation={handleInstantResetNewQuotation}
        isSimplifiedMode={outputMode === 'simplified'}
        onToggleSimplifiedMode={handleToggleSimplifiedMode}
        onOpenContractEditor={() => setIsContractEditorOpen(true)}
      />

      {/* Smart Contract Full Editor Modal */}
      <ContractEditorModal
        isOpen={isContractEditorOpen}
        onClose={() => setIsContractEditorOpen(false)}
        clientInfo={clientInfo}
        items={cartItems}
        onSaveContract={handleSaveContractData}
        onSaveAndPreview={cartItems.length > 0 ? handleSaveContractAndPreview : undefined}
      />

      {/* Gemini AI Deed & Project Data Assistant Modal */}
      <GeminiDeedAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentClientInfo={clientInfo}
        onApplyExtractedData={handleApplyAiExtractedData}
      />

      {/* Pricing Guide Modal */}
      <PricingGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Master Template Info Modal */}
      <MasterTemplateInfoModal
        isOpen={isMasterTemplateOpen}
        onClose={() => setIsMasterTemplateOpen(false)}
      />

      {/* Saved Quotations Modal */}
      <SavedQuotationsModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedQuotations={savedQuotations}
        onLoadQuotation={handleLoadQuotation}
        onDeleteQuotation={handleDeleteQuotation}
        onDeleteMultipleQuotations={handleDeleteMultipleQuotations}
        isCloudConnected={isCloudConnected}
        isAdmin={Boolean(currentUser && isUserPrimaryAdmin(currentUser.engineerName))}
      />

      {/* Export and Mobile / Desktop Install Modal */}
      <ExportAndInstallModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Admin Security & Office Passcode Modal (For Administrators: M. Maged & M. Nour) */}
      {currentUser && isUserPrimaryAdmin(currentUser.engineerName) && (
        <AdminSecurityModal
          isOpen={isSecurityOpen}
          onClose={() => setIsSecurityOpen(false)}
          session={currentUser}
          onSessionUpdated={(updated) => {
            setCurrentUser(updated);
            setClientInfo((prev) => ({ ...prev, preparedBy: updated.engineerName }));
            showToast('تم تحديث بيانات المهندس بنجاح');
          }}
          onLogout={handleLogout}
          onResetDraftSequence={handleResetDraftSequence}
        />
      )}
    </div>
  );
}
