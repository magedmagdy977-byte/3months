import React from 'react';
import {
  ClientInfo,
  ContractData,
  PaymentMilestone,
  QuotationItem,
} from '../../types';
import {
  formatNumber,
  getQuotationAreaDetails,
  tafqeetSAR,
} from '../../utils/formatters';
import { formatContractDisplayDate } from '../../data/smartContractEngine';
import { LuminousLogo } from '../LuminousLogo';
import { FileEdit } from 'lucide-react';

interface ContractPrintViewProps {
  contract: ContractData;
  clientInfo: ClientInfo;
  items: QuotationItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  milestones: PaymentMilestone[];
  onEditContract?: () => void;
  onEditMilestones?: () => void;
  startsOnNewPage?: boolean;
}

const ARABIC_ORDINALS = [
  'أولاً',
  'ثانياً',
  'ثالثاً',
  'رابعاً',
  'خامساً',
  'سادساً',
  'سابعاً',
  'ثامناً',
];

const formatPlainEnNumber = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(val || 0));
};

export const ContractPrintView: React.FC<ContractPrintViewProps> = ({
  contract,
  clientInfo,
  items,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  milestones,
  onEditContract,
  onEditMilestones,
  startsOnNewPage = false,
}) => {
  const areaDetails = getQuotationAreaDetails(clientInfo, items);
  const amountAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Build dynamic sequential Arabic ordinals so article numbers never have gaps when sections are toggled
  let ordinalIndex = 0;
  const nextOrdinal = () => ARABIC_ORDINALS[ordinalIndex++] || `${ordinalIndex}`;

  const projectOverviewOrdinal = contract.showProjectOverview && contract.projectOverviewText.trim()
    ? nextOrdinal()
    : null;
  const consultantScopeOrdinal = nextOrdinal();
  const supervisionStagesOrdinal =
    contract.showSupervisionStages && contract.supervisionStages.length > 0
      ? nextOrdinal()
      : null;
  const ownerObligationsOrdinal =
    contract.ownerObligations.length > 0 ? nextOrdinal() : null;
  const timelineOrdinal =
    contract.showTimelineTable && contract.timelineRows.length > 0
      ? nextOrdinal()
      : null;
  const generalTermsOrdinal =
    contract.generalTerms.length > 0 ? nextOrdinal() : null;
  const ipRightsOrdinal =
    contract.showIpRights && contract.ipRights.length > 0 ? nextOrdinal() : null;
  const pricingOrdinal = nextOrdinal();

  // First party dynamic legal sentence matching the reference PDF structure
  const firstPartyName = contract.firstPartyName?.trim() || clientInfo.clientName?.trim() || '..................................';
  const firstPartyId = contract.firstPartyId?.trim() || clientInfo.nationalId?.trim() || '........................';
  const firstPartyAddress = contract.firstPartyAddress?.trim() || `مدينة ${clientInfo.projectCity || 'الرياض'}${clientInfo.district ? ` – حي ${clientInfo.district}` : ''}`;
  const firstPartyPhone = contract.firstPartyPhone?.trim() || clientInfo.phone?.trim() || '........................';
  const firstPartyEmail = contract.firstPartyEmail?.trim() || clientInfo.email?.trim() || '—';
  const plotNumber = clientInfo.plotNumber?.trim() || '—';
  const planNumber = clientInfo.planNumber?.trim() || '—';
  const deedNumber = contract.propertyRealEstateNumber?.trim() || clientInfo.deedNumber?.trim() || '—';
  const districtDisplay = clientInfo.district?.trim() || 'الموضح أعلاه';
  const cityDisplay = clientInfo.projectCity?.trim() || 'الرياض';
  const numericArea = areaDetails.numericArea || clientInfo.landArea || 0;

  return (
    <div
      dir="rtl"
      className={`print-contract-container max-w-[210mm] mx-auto bg-white shadow-2xl rounded-2xl print:rounded-none print:shadow-none border border-stone-200 print:border-none text-[#2c2e30] text-right font-sans px-6 sm:px-10 py-8 print:px-2 print:py-2 ${
        startsOnNewPage ? 'print-page-break-before mt-8 print:mt-0' : ''
      }`}
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
    >
      {/* =====================================================================
          1. ARCHITECTURAL LETTERHEAD (Luminous Vision + Taupe Accent Rule)
         ===================================================================== */}
      <header className="pb-3 mb-5 border-b border-[#d4cfc3] relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 flex items-center justify-center">
              <LuminousLogo variant="icon" className="w-full h-full" />
            </div>
            <div>
              <div className="text-[15px] font-black text-[#2c2e30] leading-tight">
                شركة الرؤية المضيئة للاستشارات الهندسية
              </div>
              <div
                dir="ltr"
                className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.2em] mt-0.5"
              >
                <span className="text-[#433c71]">LUMINOUS</span>
                <span className="text-[#a6926b]">VISION</span>
                <span className="text-[#78746c] tracking-normal font-bold">
                  ENGINEERING CONSULTANCY
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditContract && (
              <button
                type="button"
                onClick={onEditContract}
                className="no-print inline-flex items-center gap-1.5 text-xs font-bold text-[#2c2e30] bg-[#ecebe7] hover:bg-[#e1dfd8] border border-[#c7c2b6] px-3 py-1.5 rounded-lg transition cursor-pointer"
                title="تعديل كافة بنود ونصوص ومواد العقد"
              >
                <FileEdit className="w-3.5 h-3.5 text-[#8a754c]" />
                <span>تعديل بنود العقد</span>
              </button>
            )}
            <div className="text-left text-[11px] text-[#5e5c57] tabular-nums">
              <div>
                رقم العقد: <strong className="text-[#2c2e30] font-mono">{contract.contractNumber}</strong>
              </div>
              <div>
                التاريخ: <strong className="text-[#2c2e30]">{formatContractDisplayDate(contract.signingDate)} م</strong>
              </div>
            </div>
          </div>
        </div>
        {/* Signature thin bronze-taupe rule under letterhead */}
        <div className="h-[2.5px] w-24 bg-[#a6926b] mt-3" />
      </header>

      {/* =====================================================================
          2. HERO CONTRACT TITLE BANNER (Architectural Light Grey + Bronze Bar)
         ===================================================================== */}
      <section className="relative bg-[#ecebe7] px-6 py-5 mb-5 flex items-center justify-between border-r-0">
        <div>
          <h1 className="text-2xl sm:text-[26px] print:text-[22px] font-black text-[#26282a] leading-snug">
            {contract.contractTitle}
          </h1>
          {contract.contractSubtitle?.trim() && (
            <div className="text-xl sm:text-[22px] print:text-[18px] font-black text-[#3a3c3e] mt-0.5 leading-snug">
              {contract.contractSubtitle}
            </div>
          )}
        </div>
        {/* Thin architectural vertical bronze bar matching reference PDF */}
        <div className="w-[3.5px] self-stretch bg-[#a6926b] shrink-0 mr-4" aria-hidden="true" />
      </section>

      {/* =====================================================================
          3. BASMALAH & SIGNING DECLARATION
         ===================================================================== */}
      <section className="text-center space-y-1.5 mb-5 px-2">
        <p className="text-[12.5px] print:text-[11px] font-bold text-[#2c2e30]">
          الحمد لله رب العالمين والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين أما بعد،
        </p>
        <p className="text-[12px] print:text-[10.5px] text-[#3a3c3e] leading-relaxed">
          بعون من الله وتوفيقه تم إبرام العقد رقم (
          <strong className="font-mono text-[#1f2022]">{contract.contractNumber}</strong>) والتوقيع عليه بمدينة{' '}
          <strong className="text-[#1f2022]">{contract.signingCity || 'الرياض'}</strong> يوم{' '}
          <strong className="text-[#1f2022]">{contract.signingDayName}</strong> الموافق{' '}
          <strong className="tabular-nums text-[#1f2022]">{formatContractDisplayDate(contract.signingDate)} م</strong>
        </p>
      </section>

      {/* =====================================================================
          4. PARTIES & PREAMBLE (Warm Sand & Light Grey Architectural Blocks)
         ===================================================================== */}
      <section className="space-y-2.5 mb-5 text-[12px] print:text-[10.5px] leading-[1.85]">
        {/* الطرف الأول */}
        <div className="bg-[#f3f0e8] px-4 py-3 text-[#2c2e30] border-b border-[#e4dfd2]">
          <strong className="font-black text-[#1f2022]">الطرف الأول: </strong>
          <strong className="text-[#7c6840] font-extrabold">{firstPartyName}</strong>
          {' '}– هوية رقم: (<span className="font-mono font-bold">{firstPartyId}</span>)، عنوان:{' '}
          <span>{firstPartyAddress}</span>، جوال:{' '}
          <span className="font-mono font-bold" dir="ltr">
            {firstPartyPhone}
          </span>
          ، بريد إلكتروني: (<span dir="ltr">{firstPartyEmail}</span>)، مالك قطعة الأرض برقم (
          <strong>{plotNumber}</strong>)، من المخطط رقم (<strong>{planNumber}</strong>)، برقم الصك/العقار (
          <strong>{deedNumber}</strong>)، الواقعة في حي{' '}
          <strong className="text-[#7c6840]">{districtDisplay}</strong>، بمدينة{' '}
          <strong className="text-[#7c6840]">{cityDisplay}</strong>،{' '}
          {areaDetails.departmentId === 'decor' ? (
            <>
              بمساحة طابقية وقدرها (<strong>{formatNumber(numericArea)} م²</strong>)
            </>
          ) : (
            <>
              بمساحة إجمالية وقدرها (<strong>{formatNumber(numericArea)} م²</strong>)
            </>
          )}
          ، ويشار إليه فيما بعد بالطرف الأول أو المالك.
        </div>

        {/* الطرف الثاني */}
        <div className="bg-[#ecebe7] px-4 py-3 text-[#2c2e30] border-b border-[#dfddd6]">
          <strong className="font-black text-[#1f2022]">الطرف الثاني: </strong>
          <span>{contract.secondPartyText}</span>
        </div>

        {/* المقدمة */}
        <div className="bg-[#f3f0e8] px-4 py-3 text-[#2c2e30] border-b border-[#e4dfd2]">
          <strong className="font-black text-[#1f2022]">المقدمة: </strong>
          <span>{contract.preambleText}</span>
        </div>
      </section>

      {/* =====================================================================
          5. OPTIONAL PROJECT OVERVIEW (أولاً في عقود الإشراف والتنفيذ)
         ===================================================================== */}
      {projectOverviewOrdinal && (
        <section className="mb-4 break-inside-avoid">
          <div className="bg-[#e8e7e2] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3">
            <span>{projectOverviewOrdinal}</span>
            <span>:</span>
            <span>الوصف العام للمشروع :</span>
          </div>
          <div className="bg-[#f7f6f3] px-4 py-2.5 text-[12px] print:text-[10.5px] font-bold text-[#2c2e30] border-b border-[#e6e4dc]">
            {contract.projectOverviewText}
          </div>
        </section>
      )}

      {/* =====================================================================
          6. CONSULTANT OBLIGATIONS & DETAILED SCOPE OF WORK
         ===================================================================== */}
      <section className="mb-5">
        <div className="bg-[#e5e3dc] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3 mb-2">
          <span>{consultantScopeOrdinal}</span>
          <span>:</span>
          <span>{contract.consultantScopeTitle || 'التزامات الاستشاري :'}</span>
        </div>

        <div className="space-y-1.5">
          {contract.scopeGroups.map((group, gIdx) => {
            const isAlt = gIdx % 2 === 1;
            const hasHeader = Boolean(group.title?.trim());
            const hasSubtitle = Boolean(group.subtitle?.trim());

            return (
              <div key={group.id || gIdx} className="break-inside-avoid">
                {hasHeader && (
                  <div
                    className={`px-4 py-1.5 text-[12px] print:text-[10.5px] font-black text-[#26282a] ${
                      isAlt ? 'bg-[#e6e5e0]' : 'bg-[#ecebe7]'
                    }`}
                  >
                    {group.title}
                  </div>
                )}
                {hasSubtitle && (
                  <div className="bg-[#f3f2ee] px-6 py-1.5 text-[11.5px] print:text-[10px] font-bold text-[#3f4144] border-b border-[#e6e4de]">
                    {group.subtitle}
                  </div>
                )}
                {group.items.length > 0 && (
                  <div
                    className={`px-4 py-2 text-[11.5px] print:text-[10px] text-[#2c2e30] leading-[1.8] ${
                      group.layout === 'two_column'
                        ? 'grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 bg-[#f6f5f1] border-b border-[#e6e4de]'
                        : 'bg-[#f8f7f4] border-b border-[#eae8e2] space-y-1'
                    }`}
                  >
                    {group.items.map((line, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2">
                        <span className="text-[#a6926b] font-black select-none">•</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          7. SUPERVISION INSPECTION STAGES TABLE (عند تفعيل مراحل الاستلام)
         ===================================================================== */}
      {supervisionStagesOrdinal && (
        <section className="mb-5 break-inside-avoid">
          <div className="bg-[#e5e3dc] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3 mb-2">
            <span>{supervisionStagesOrdinal}</span>
            <span>:</span>
            <span>{contract.supervisionStagesTitle || 'مراحل استلامات الأعمال :'}</span>
          </div>

          <div className="px-2 space-y-1 text-[11.5px] print:text-[10px] text-[#2c2e30] mb-2.5 leading-relaxed">
            {contract.supervisionMaxVisitsText && <p className="font-semibold">{contract.supervisionMaxVisitsText}</p>}
            {contract.supervisionExtraVisitFeeText && (
              <p className="font-bold text-[#7c6840]">{contract.supervisionExtraVisitFeeText}</p>
            )}
          </div>

          <table className="w-full text-[11.5px] print:text-[10px] border-collapse border border-[#dcdad2]">
            <thead>
              <tr className="bg-[#ecebe7] text-[#26282a] font-black">
                <th className="border border-[#dcdad2] py-2 px-3 text-center w-14">م</th>
                <th className="border border-[#dcdad2] py-2 px-4 text-right">البيان (المرحلة الإنشائية)</th>
              </tr>
            </thead>
            <tbody>
              {contract.supervisionStages.map((stage, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f6f5f1]'}>
                  <td className="border border-[#dcdad2] py-1.5 px-3 text-center font-mono font-bold text-[#5e5c57]">
                    {idx + 1}
                  </td>
                  <td className="border border-[#dcdad2] py-1.5 px-4 font-bold text-[#2c2e30]">
                    {stage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* =====================================================================
          8. OWNER OBLIGATIONS (التزامات المالك)
         ===================================================================== */}
      {ownerObligationsOrdinal && (
        <section className="mb-5 break-inside-avoid">
          <div className="bg-[#e5e3dc] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3 mb-2">
            <span>{ownerObligationsOrdinal}</span>
            <span>:</span>
            <span>التزامات المالك :</span>
          </div>
          <div className="bg-[#f8f7f4] border border-[#e6e4de] px-4 py-2.5 space-y-1.5 text-[11.5px] print:text-[10px] text-[#2c2e30] leading-[1.8]">
            {contract.ownerObligations.map((ob, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#a6926b] font-black select-none">•</span>
                <span>{ob}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          9. PROJECT TIMELINE TABLE (المدة الزمنية لإنهاء مراحل المشروع)
         ===================================================================== */}
      {timelineOrdinal && (
        <section className="mb-5 break-inside-avoid">
          <div className="bg-[#e5e3dc] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3 mb-2">
            <span>{timelineOrdinal}</span>
            <span>:</span>
            <span>المدة الزمنية لإنهاء مراحل المشروع :</span>
          </div>

          {contract.timelineNotes.length > 0 && (
            <div className="px-2 mb-2.5 space-y-1 text-[11.5px] print:text-[10px] text-[#3a3c3e] leading-relaxed">
              {contract.timelineNotes.map((note, idx) => (
                <p key={idx}>{note}</p>
              ))}
            </div>
          )}

          <table className="w-full text-[11.5px] print:text-[10px] border-collapse border border-[#cfcdc5]">
            <thead>
              <tr className="bg-[#3a3c3e] text-white font-bold">
                <th className="border border-[#4c4f52] py-2 px-3 text-center w-24">المرحلة</th>
                <th className="border border-[#4c4f52] py-2 px-3 text-center w-44">وصف العمل</th>
                <th className="border border-[#4c4f52] py-2 px-3 text-center">تفاصيل الأعمال</th>
                <th className="border border-[#4c4f52] py-2 px-3 text-center w-28">الفترة الزمنية</th>
              </tr>
            </thead>
            <tbody>
              {contract.timelineRows.map((row, idx) => (
                <tr key={row.id || idx} className={idx % 2 === 0 ? 'bg-[#f6f5f1]' : 'bg-white'}>
                  <td className="border border-[#dcdad2] py-2 px-3 text-center font-bold text-[#26282a]">
                    {row.stage}
                  </td>
                  <td className="border border-[#dcdad2] py-2 px-3 text-center font-bold text-[#26282a]">
                    {row.workTitle}
                  </td>
                  <td className="border border-[#dcdad2] py-2 px-3 text-center text-[#3a3c3e]">
                    {row.details}
                  </td>
                  <td className="border border-[#dcdad2] py-2 px-3 text-center font-black text-[#26282a] tabular-nums">
                    {row.duration}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#ecebe7] font-black text-[#26282a]">
                <td colSpan={3} className="border border-[#dcdad2] py-2 px-3 text-center">
                  {contract.timelineTotalLabel || 'إجمالي المدة الزمنية للمشروع'}
                </td>
                <td className="border border-[#dcdad2] py-2 px-3 text-center tabular-nums">
                  {contract.timelineTotalDuration}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* =====================================================================
          10. GENERAL TERMS (شروط عامة)
         ===================================================================== */}
      {generalTermsOrdinal && (
        <section className="mb-5">
          <div className="bg-[#e5e3dc] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3 mb-2 break-after-avoid">
            <span>{generalTermsOrdinal}</span>
            <span>:</span>
            <span>شروط عامة :</span>
          </div>
          <div className="bg-[#f8f7f4] border border-[#e6e4de] px-4 py-3 space-y-2 text-[11.5px] print:text-[10px] text-[#2c2e30] leading-[1.85]">
            {contract.generalTerms.map((term, idx) => (
              <div key={idx} className="flex items-start gap-2 break-inside-avoid">
                <span className="text-[#a6926b] font-black select-none">•</span>
                <span>{term}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          11. INTELLECTUAL PROPERTY RIGHTS (حقوق الملكية الفكرية والفنية)
         ===================================================================== */}
      {ipRightsOrdinal && (
        <section className="mb-5 break-inside-avoid">
          <div className="bg-[#e5e3dc] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3 mb-2">
            <span>{ipRightsOrdinal}</span>
            <span>:</span>
            <span>حقوق الملكية الفكرية والفنية :</span>
          </div>
          <div className="bg-[#f8f7f4] border border-[#e6e4de] px-4 py-2.5 space-y-1.5 text-[11.5px] print:text-[10px] text-[#2c2e30] leading-[1.8]">
            {contract.ipRights.map((ip, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#a6926b] font-black select-none">•</span>
                <span>{ip}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          12. PRICING, PAYMENT SCHEDULE & BANK DETAILS (الأسعار وطريقة الدفع)
         ===================================================================== */}
      <section className="mb-5 break-inside-avoid">
        <div className="bg-[#e5e3dc] px-4 py-2 text-[13px] print:text-[11.5px] font-black text-[#26282a] flex items-center gap-3 mb-2">
          <span>{pricingOrdinal}</span>
          <span>:</span>
          <span>الأسعار وطريقة الدفع :</span>
        </div>

        <p className="text-[11.5px] print:text-[10px] text-[#2c2e30] mb-2.5 px-1 leading-relaxed">
          {contract.pricingIntroText}
        </p>

        {/* Financial Breakdown Table (Matches PDF dark charcoal bands) */}
        <table className="w-full text-[11.5px] print:text-[10px] border-collapse border border-[#cfcdc5] mb-4">
          <thead>
            <tr className="bg-[#3a3c3e] text-white font-bold">
              <th className="border border-[#4c4f52] py-2 px-3 text-center w-14">م</th>
              <th className="border border-[#4c4f52] py-2 px-4 text-center">البيان</th>
              <th className="border border-[#4c4f52] py-2 px-4 text-center w-36">المبلغ الإجمالي (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f6f5f1]'}>
                  <td className="border border-[#dcdad2] py-2 px-3 text-center font-mono font-bold text-[#5e5c57]">
                    {idx + 1}
                  </td>
                  <td className="border border-[#dcdad2] py-2 px-4 text-center font-bold text-[#26282a]">
                    {item.title}
                  </td>
                  <td className="border border-[#dcdad2] py-2 px-4 text-center font-mono font-black text-[#26282a] tabular-nums">
                    {formatPlainEnNumber(item.totalPrice)}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="bg-white">
                <td className="border border-[#dcdad2] py-2 px-3 text-center font-mono font-bold">1</td>
                <td className="border border-[#dcdad2] py-2 px-4 text-center font-bold">
                  قيمة أعمال {clientInfo.serviceType}
                </td>
                <td className="border border-[#dcdad2] py-2 px-4 text-center font-mono font-black tabular-nums">
                  {formatPlainEnNumber(subtotal)}
                </td>
              </tr>
            )}

            {discountAmount > 0 && (
              <tr className="bg-[#f3f0e8]">
                <td className="border border-[#dcdad2] py-2 px-3 text-center text-[#7c6840] font-bold">—</td>
                <td className="border border-[#dcdad2] py-2 px-4 text-center font-bold text-[#7c6840]">
                  خصم تجاري {clientInfo.discountType === 'percentage' ? `بنسبة ${clientInfo.discountValue}%` : 'خاص'}
                </td>
                <td className="border border-[#dcdad2] py-2 px-4 text-center font-mono font-black text-[#7c6840] tabular-nums">
                  - {formatPlainEnNumber(discountAmount)}
                </td>
              </tr>
            )}

            <tr className="bg-[#3a3c3e] text-white font-bold">
              <td colSpan={2} className="border border-[#4c4f52] py-2 px-4 text-center">
                إجمالي قيمة العقد بدون الضريبة
              </td>
              <td className="border border-[#4c4f52] py-2 px-4 text-center font-mono font-black tabular-nums">
                {formatPlainEnNumber(amountAfterDiscount)}
              </td>
            </tr>

            {clientInfo.includeTax ? (
              <>
                <tr className="bg-[#4b4d50] text-white font-bold">
                  <td colSpan={2} className="border border-[#5c5e61] py-2 px-4 text-center">
                    إجمالي قيمة الضريبة المضافة (15%)
                  </td>
                  <td className="border border-[#5c5e61] py-2 px-4 text-center font-mono font-black tabular-nums">
                    {formatPlainEnNumber(taxAmount)}
                  </td>
                </tr>
                <tr className="bg-[#2a2c2e] text-white font-black text-[12.5px] print:text-[11px]">
                  <td colSpan={2} className="border border-[#444649] py-2.5 px-4 text-center">
                    إجمالي قيمة العقد شامل الضريبة المضافة (15%)
                  </td>
                  <td className="border border-[#444649] py-2.5 px-4 text-center font-mono font-black text-[#f3dfb8] tabular-nums">
                    {formatPlainEnNumber(grandTotal)}
                  </td>
                </tr>
              </>
            ) : (
              <tr className="bg-[#2a2c2e] text-white font-black text-[12.5px] print:text-[11px]">
                <td colSpan={2} className="border border-[#444649] py-2.5 px-4 text-center">
                  إجمالي قيمة العقد (غير شامل ضريبة القيمة المضافة)
                </td>
                <td className="border border-[#444649] py-2.5 px-4 text-center font-mono font-black text-[#f3dfb8] tabular-nums">
                  {formatPlainEnNumber(grandTotal)}
                </td>
              </tr>
            )}

            <tr className="bg-[#3a3c3e] text-[#f3dfb8] font-bold">
              <td colSpan={3} className="border border-[#4c4f52] py-2 px-4 text-center text-[11.5px] print:text-[10px]">
                {tafqeetSAR(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Schedule Table */}
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[11.5px] print:text-[10px] font-bold text-[#2c2e30]">
            {contract.paymentMethodNote}
          </p>
          {onEditMilestones && (
            <button
              type="button"
              onClick={onEditMilestones}
              className="no-print text-[11px] font-bold text-[#7c6840] bg-[#f3f0e8] hover:bg-[#e8e3d5] border border-[#d6ceb9] px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              تعديل جدول الدفعات
            </button>
          )}
        </div>

        <table className="w-full text-[11.5px] print:text-[10px] border-collapse border border-[#cfcdc5] mb-4">
          <thead>
            <tr className="bg-[#3a3c3e] text-white font-bold">
              <th className="border border-[#4c4f52] py-2 px-3 text-center w-12">م</th>
              <th className="border border-[#4c4f52] py-2 px-3 text-center w-36">الدفعة</th>
              <th className="border border-[#4c4f52] py-2 px-4 text-center">البيان</th>
              <th className="border border-[#4c4f52] py-2 px-3 text-center w-20">النسبة</th>
              <th className="border border-[#4c4f52] py-2 px-3 text-center w-28">المبلغ (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((m, idx) => (
              <tr key={m.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f6f5f1]'}>
                <td className="border border-[#dcdad2] py-2 px-3 text-center font-mono font-bold text-[#5e5c57]">
                  {idx + 1}
                </td>
                <td className="border border-[#dcdad2] py-2 px-3 text-center font-bold text-[#26282a]">
                  {m.title}
                </td>
                <td className="border border-[#dcdad2] py-2 px-4 text-center text-[#3a3c3e]">
                  {m.description}
                </td>
                <td className="border border-[#dcdad2] py-2 px-3 text-center font-mono font-black text-[#26282a] tabular-nums">
                  {m.percentage}%
                </td>
                <td className="border border-[#dcdad2] py-2 px-3 text-center font-mono font-black text-[#26282a] tabular-nums">
                  {formatPlainEnNumber(m.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bank Account Table */}
        <table className="w-full text-[11.5px] print:text-[10px] border-collapse border border-[#dcdad2] mb-5">
          <tbody>
            <tr className="bg-white">
              <td className="border border-[#dcdad2] py-2 px-4 font-bold text-[#5e5c57] w-40 bg-[#f6f5f1]">
                البنك
              </td>
              <td className="border border-[#dcdad2] py-2 px-4 text-center font-bold text-[#26282a]">
                {clientInfo.bankDetails?.bankName || 'البنك السعودي للاستثمار'}
              </td>
            </tr>
            <tr className="bg-[#f3f0e8]/60">
              <td className="border border-[#dcdad2] py-2 px-4 font-bold text-[#5e5c57] bg-[#f6f5f1]">
                اسم الحساب
              </td>
              <td className="border border-[#dcdad2] py-2 px-4 text-center font-bold text-[#26282a]">
                {clientInfo.bankDetails?.accountName || 'شركة الرؤية المضيئة للاستشارات الهندسية'}
              </td>
            </tr>
            {clientInfo.bankDetails?.accountNumber && (
              <tr className="bg-white">
                <td className="border border-[#dcdad2] py-2 px-4 font-bold text-[#5e5c57] bg-[#f6f5f1]">
                  رقم الحساب
                </td>
                <td className="border border-[#dcdad2] py-2 px-4 text-center font-mono font-bold text-[#26282a] tabular-nums" dir="ltr">
                  {clientInfo.bankDetails.accountNumber}
                </td>
              </tr>
            )}
            <tr className="bg-[#f3f0e8]/60">
              <td className="border border-[#dcdad2] py-2 px-4 font-bold text-[#5e5c57] bg-[#f6f5f1]">
                الآيبان (IBAN)
              </td>
              <td className="border border-[#dcdad2] py-2 px-4 text-center font-mono font-black text-[#26282a] tabular-nums" dir="ltr">
                {clientInfo.bankDetails?.iban || 'SA83 6500 0000 1383 4937 6001'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Closing & Two-Party Signatures */}
        <div className="text-center text-[12.5px] print:text-[11px] font-bold text-[#26282a] mb-3">
          {contract.closingText || 'هذا والله ولي التوفيق،'}
        </div>

        <table className="w-full text-[12px] print:text-[10.5px] border-collapse border border-[#cfcdc5]">
          <thead>
            <tr className="bg-[#3a3c3e] text-white font-black">
              <th className="border border-[#4c4f52] py-2 px-4 text-center w-1/2">الطرف الأول (المالك)</th>
              <th className="border border-[#4c4f52] py-2 px-4 text-center w-1/2">الطرف الثاني (الاستشاري)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#f3f0e8]">
              <td className="border border-[#dcdad2] py-3 px-4 text-center font-bold text-[#26282a] align-top">
                <div className="font-black text-[12.5px] mb-2">{firstPartyName}</div>
                <div className="text-[11px] text-[#5e5c57] space-y-1.5 text-right pt-2">
                  <div>التوقيع: ...................................................</div>
                  <div>التاريخ: ..... / ..... / 2026 م</div>
                </div>
              </td>
              <td className="border border-[#dcdad2] py-3 px-4 text-center font-bold text-[#26282a] align-top">
                <div className="font-black text-[12.5px] mb-2">
                  شركة الرؤية المضيئة للاستشارات الهندسية
                </div>
                {contract.showCompanySeal ? (
                  <div className="flex justify-center pt-1">
                    <img
                      src="/official-seal.png"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.indexOf('/official-emblem.svg') === -1) {
                          target.src = '/official-emblem.svg';
                        }
                      }}
                      alt="ختم شركة الرؤية المضيئة للاستشارات الهندسية"
                      className="h-16 print:h-14 w-auto object-contain select-none"
                      loading="eager"
                    />
                  </div>
                ) : (
                  <div className="text-[11px] text-[#5e5c57] space-y-1.5 text-right pt-2">
                    <div>التوقيع والختم: ..........................................</div>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Subtle architectural bottom bar */}
      <footer className="pt-3 mt-4 border-t border-[#d4cfc3] flex items-center justify-between text-[10px] print:text-[8.5px] text-[#78746c]">
        <div className="flex items-center gap-3">
          <div className="h-[2.5px] w-16 bg-[#a6926b]" />
          <span>شركة الرؤية المضيئة للاستشارات الهندسية • س.ت: 1010788646</span>
        </div>
        <span className="font-mono font-bold text-[#5e5c57]">عقد رقم {contract.contractNumber}</span>
      </footer>
    </div>
  );
};
